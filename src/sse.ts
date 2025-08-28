import {
  MessageHandler,
  PushletClient,
  ReconnectOptions,
  HeartbeatOptions,
} from "./pushletClient";

export class SSE extends PushletClient {
  constructor(
    baseUrl: string,
    reconnectOptions?: Partial<ReconnectOptions>,
    heartbeatOptions?: Partial<HeartbeatOptions>
  ) {
    super(baseUrl, "sse", reconnectOptions, heartbeatOptions);
  }

  private createEventSource(
    topic: string,
    onMessage: MessageHandler
  ): EventSource {
    const url = `${this.baseUrl}?topic=${encodeURIComponent(topic)}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      // 重置重连计数器，因为接收到消息说明连接正常
      this.reconnectAttempts.set(topic, 0);

      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {
        onMessage(event.data); // fallback
      }
    };

    source.onopen = () => {
      console.log(`SSE connected to topic "${topic}"`);
      // 重置重连计数器
      this.reconnectAttempts.set(topic, 0);
    };

    source.onerror = (err) => {
      console.error(`SSE error on topic "${topic}":`, err);

      if (source.readyState === EventSource.CLOSED) {
        console.log(`SSE connection closed for topic "${topic}"`);
        this.handleReconnect(topic, onMessage);
      }
    };

    return source;
  }

  private handleReconnect(topic: string, onMessage: MessageHandler): void {
    if (!this.shouldReconnect(topic)) {
      console.log(`Max reconnect attempts reached for topic "${topic}"`);
      return;
    }

    const currentAttempts = this.reconnectAttempts.get(topic) || 0;
    this.reconnectAttempts.set(topic, currentAttempts + 1);

    const delay = this.calculateRetryDelay(currentAttempts);
    console.log(
      `Attempting to reconnect to topic "${topic}" in ${delay}ms (attempt ${
        currentAttempts + 1
      }/${this.reconnectOptions.maxRetries})`
    );

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(topic);

      // 检查是否仍然需要重连（可能用户已经取消订阅）
      if (this.handlers.has(topic)) {
        console.log(`Reconnecting to SSE topic "${topic}"`);
        const newSource = this.createEventSource(topic, onMessage);
        this.sources.set(topic, newSource);
      }
    }, delay);

    this.reconnectTimers.set(topic, timer);
  }

  toSubscribe(topic: string, onMessage: MessageHandler): () => void {
    if (this.sources.has(topic)) {
      console.warn(`Already subscribed to topic "${topic}"`);
      // 即使已订阅，也返回一个可用的取消订阅函数
      return () => this.toUnsubscribe(topic);
    }

    // 清除可能存在的重连定时器
    this.clearReconnectTimer(topic);

    // 重置重连计数器
    this.reconnectAttempts.set(topic, 0);

    const source = this.createEventSource(topic, onMessage);
    this.sources.set(topic, source);
    this.handlers.set(topic, onMessage);

    // 返回一个取消订阅的函数
    return () => this.toUnsubscribe(topic);
  }

  toUnsubscribe(topic: string): void {
    // 清除重连定时器
    this.clearReconnectTimer(topic);

    // 清除重连计数器
    this.reconnectAttempts.delete(topic);

    const source = this.sources.get(topic);
    if (source) {
      source.close();
      this.sources.delete(topic);
      this.handlers.delete(topic);
      console.log(`Unsubscribed from topic "${topic}"`);
    }
  }
}
