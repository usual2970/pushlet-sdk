import { MessageHandler, PushletClient } from ".";

export class SSE extends PushletClient {
  constructor(baseUrl: string) {
    super(baseUrl, "sse");
  }

  toSubscribe(topic: string, onMessage: MessageHandler): () => void {
    if (this.sources.has(topic)) {
      console.warn(`Already subscribed to topic "${topic}"`);
      // 即使已订阅，也返回一个可用的取消订阅函数
      return () => this.toUnsubscribe(topic);
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
    return () => this.toUnsubscribe(topic);
  }

  toUnsubscribe(topic: string): void {
    const source = this.sources.get(topic);
    if (source) {
      source.close();
      this.sources.delete(topic);
      this.handlers.delete(topic);
      console.log(`Unsubscribed from topic "${topic}"`);
    }
  }
}
