import {
  MessageHandler,
  PushletClient,
  ReconnectOptions,
  HeartbeatOptions,
} from "./pushletClient";
import { parseBinaryAsText, parseTextAsBinary } from "./utils";

export class WS extends PushletClient {
  private wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsReconnectAttempts: number = 0;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPongTime: number = 0;
  private networkStatusListener: ((event: Event) => void) | null = null;

  constructor(
    baseUrl: string,
    reconnectOptions?: Partial<ReconnectOptions>,
    heartbeatOptions?: Partial<HeartbeatOptions>
  ) {
    super(baseUrl, "ws", reconnectOptions, heartbeatOptions);
    this.setupNetworkStatusListeners();
  }

  private setupNetworkStatusListeners(): void {
    // 监听网络状态变化
    if (typeof window !== "undefined") {
      this.networkStatusListener = () => {
        if (!navigator.onLine && this.wsConnection) {
          console.log("Network offline detected, closing WebSocket connection");
          this.wsConnection.close();
        } else if (navigator.onLine && this.handlers.size > 0) {
          console.log("Network online detected, attempting to reconnect");
          this.handleWsReconnect();
        }
      };

      window.addEventListener("offline", this.networkStatusListener);
      window.addEventListener("online", this.networkStatusListener);
    }
  }

  private clearNetworkStatusListeners(): void {
    if (typeof window !== "undefined" && this.networkStatusListener) {
      window.removeEventListener("offline", this.networkStatusListener);
      window.removeEventListener("online", this.networkStatusListener);
      this.networkStatusListener = null;
    }
  }

  private startHeartbeat(): void {
    if (!this.heartbeatOptions.enabled) return;

    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        // 发送心跳消息
        this.wsConnection.send(parseTextAsBinary("PING"));

        // 设置心跳超时检测
        this.heartbeatTimeoutTimer = setTimeout(() => {
          console.log("Heartbeat timeout, closing connection");
          if (this.wsConnection) {
            this.wsConnection.close();
          }
        }, this.heartbeatOptions.timeout);
      }
    }, this.heartbeatOptions.interval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private handlePong(): void {
    this.lastPongTime = Date.now();
    // 清除心跳超时定时器
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private clearWsReconnectTimer(): void {
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
      this.wsReconnectTimer = null;
    }
  }

  private shouldReconnectWs(): boolean {
    if (!this.reconnectOptions.enabled) return false;
    return this.wsReconnectAttempts < this.reconnectOptions.maxRetries;
  }

  private handleWsReconnect(): void {
    if (!this.shouldReconnectWs()) {
      console.log(
        `Max WebSocket reconnect attempts reached (${this.reconnectOptions.maxRetries})`
      );
      return;
    }

    const delay = this.calculateRetryDelay(this.wsReconnectAttempts);
    this.wsReconnectAttempts++;

    console.log(
      `Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.wsReconnectAttempts}/${this.reconnectOptions.maxRetries})`
    );

    this.wsReconnectTimer = setTimeout(() => {
      this.wsReconnectTimer = null;
      console.log(`Reconnecting WebSocket...`);
      this.initWebSocket();
    }, delay);
  }

  initWebSocket() {
    // 检查是否已经有连接存在（包括正在连接的状态）
    if (
      this.wsConnection &&
      (this.wsConnection.readyState === WebSocket.CONNECTING ||
        this.wsConnection.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.wsConnection = new WebSocket(this.baseUrl);
    this.wsConnection.binaryType = "arraybuffer";

    this.wsConnection.onopen = () => {
      console.log("WebSocket connection established");

      // 重置重连计数器
      this.wsReconnectAttempts = 0;
      this.clearWsReconnectTimer();

      // 启动心跳检测
      this.startHeartbeat();

      // 处理所有待发送的订阅消息
      this.pendingSubscriptions.forEach(({ topic }) => {
        if (this.wsConnection?.readyState === WebSocket.OPEN) {
          this.wsConnection.send(parseTextAsBinary(`SUB ${topic}`));
        }
      });

      // 重新订阅所有已有的主题
      for (const topic of this.handlers.keys()) {
        if (this.wsConnection?.readyState === WebSocket.OPEN) {
          this.wsConnection.send(parseTextAsBinary(`SUB ${topic}`));
        }
      }

      this.pendingSubscriptions = [];
    };

    this.wsConnection.onmessage = (event: MessageEvent) => {
      try {
        // 解析二进制消息格式，假设格式为 "TOPIC data"
        const message = parseBinaryAsText(event.data);

        // 处理心跳响应
        if (message === "OK") {
          this.handlePong();
          return;
        }

        const parts = message.split(" ", 2);
        if (parts.length >= 2) {
          const topic = parts[0];
          const data = message.substring(parts[0].length + 1);
          const handler = this.handlers.get(topic);
          if (handler) {
            try {
              // 尝试解析为 JSON
              const jsonData = JSON.parse(data);
              handler(jsonData);
            } catch {
              // 解析失败则传递原始字符串
              handler(data);
            }
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    this.wsConnection.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    this.wsConnection.onclose = (event) => {
      console.log("WebSocket connection closed", event.code, event.reason);
      this.wsConnection = null;

      // 停止心跳检测
      this.stopHeartbeat();

      // 如果有活跃的订阅且需要重连，则尝试重连
      if (this.handlers.size > 0 && this.shouldReconnectWs()) {
        this.handleWsReconnect();
      }
    };
  }

  toSubscribe(topic: string, onMessage: MessageHandler): () => void {
    this.initWebSocket();

    if (this.handlers.has(topic)) {
      console.warn(`Already subscribed to topic "${topic}"`);
    }

    this.handlers.set(topic, onMessage);

    // 发送订阅消息
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      // 连接已打开，直接发送
      this.wsConnection.send(parseTextAsBinary(`SUB ${topic}`));
    } else {
      // 连接未打开，添加到待处理队列
      this.pendingSubscriptions.push({ topic, handler: onMessage });
    }

    // 返回一个取消订阅的函数
    return () => {
      if (
        this.wsConnection &&
        this.wsConnection.readyState === WebSocket.OPEN
      ) {
        this.wsConnection.send(parseTextAsBinary(`UNSUB ${topic}`));
      }
      this.handlers.delete(topic);

      // 从待处理队列中移除
      this.pendingSubscriptions = this.pendingSubscriptions.filter(
        (sub) => sub.topic !== topic
      );
    };
  }

  toUnsubscribe(topic: string): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(parseTextAsBinary(`UNSUB ${topic}`));
    }
    this.handlers.delete(topic);

    // 如果没有活跃的订阅了，停止重连和心跳
    if (this.handlers.size === 0) {
      this.clearWsReconnectTimer();
      this.stopHeartbeat();
      this.wsReconnectAttempts = 0;
    }

    console.log(`Unsubscribed from WebSocket topic "${topic}"`);
  }

  // 清理资源的方法
  destroy(): void {
    // 清理所有订阅
    this.handlers.clear();
    this.pendingSubscriptions = [];

    // 关闭WebSocket连接
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    // 清理定时器
    this.clearWsReconnectTimer();
    this.stopHeartbeat();

    // 清理网络监听器
    this.clearNetworkStatusListeners();

    this.wsReconnectAttempts = 0;
  }
}
