type MessageHandler = (data: any) => void;

type ProtocolType = "ws" | "sse";
export class PushletClient {
  private sources: Map<string, EventSource> = new Map();
  private handlers: Map<string, MessageHandler> = new Map();
  private baseUrl: string;
  private protocol: ProtocolType;
  private wsConnection: WebSocket | null = null;
  private pendingSubscriptions: Array<{
    topic: string;
    handler: MessageHandler;
  }> = [];

  constructor(baseUrl: string, protocol: ProtocolType = "sse") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
    this.protocol = protocol;
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

      // 处理所有待发送的订阅消息
      this.pendingSubscriptions.forEach(({ topic }) => {
        if (this.wsConnection?.readyState === WebSocket.OPEN) {
          this.wsConnection.send(parseTextAsBinary(`SUB ${topic}`));
        }
      });
      this.pendingSubscriptions = [];
    };

    this.wsConnection.onmessage = (event: MessageEvent) => {
      try {
        // 解析二进制消息格式，假设格式为 "TOPIC data"
        const message = parseBinaryAsText(event.data);
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

    this.wsConnection.onclose = () => {
      console.log("WebSocket connection closed");
      this.wsConnection = null;
    };
  }

  subscribe(topic: string, onMessage: MessageHandler): () => void {
    if (this.protocol == "ws") {
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

    if (this.sources.has(topic)) {
      console.warn(`Already subscribed to topic "${topic}"`);
      // 即使已订阅，也返回一个可用的取消订阅函数
      return () => this.unsubscribe(topic);
    }

    const url = `${this.baseUrl}?topic=${encodeURIComponent(topic)}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage(event.data); // fallback
      }
    };

    source.onerror = (err) => {
      console.error(`SSE error on topic "${topic}":`, err);
    };

    this.sources.set(topic, source);
    this.handlers.set(topic, onMessage);

    // 返回一个取消订阅的函数
    return () => this.unsubscribe(topic);
  }

  unsubscribe(topic: string) {
    if (this.protocol === "ws") {
      // WebSocket 模式下发送取消订阅消息
      if (
        this.wsConnection &&
        this.wsConnection.readyState === WebSocket.OPEN
      ) {
        this.wsConnection.send(parseTextAsBinary(`UNSUB ${topic}`));
      }
      this.handlers.delete(topic);
      console.log(`Unsubscribed from WebSocket topic "${topic}"`);
      return;
    }

    // SSE 模式下的取消订阅逻辑
    const source = this.sources.get(topic);
    if (source) {
      source.close();
      this.sources.delete(topic);
      this.handlers.delete(topic);
      console.log(`Unsubscribed from topic "${topic}"`);
    }
  }

  unsubscribeAll() {
    if (this.protocol === "ws") {
      // WebSocket 模式下取消所有订阅
      for (const topic of this.handlers.keys()) {
        this.unsubscribe(topic);
      }
      return;
    }

    // SSE 模式下取消所有订阅
    for (const topic of this.sources.keys()) {
      this.unsubscribe(topic);
    }
  }
}

function parseBinaryAsText(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder(); // 默认就是 utf-8
  return decoder.decode(new Uint8Array(buffer));
}

function parseTextAsBinary(text: string): ArrayBuffer {
  const encoder = new TextEncoder(); // 默认就是 utf-8
  return encoder.encode(text).buffer;
}
