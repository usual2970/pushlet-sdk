type MessageHandler = (data: any) => void;

export class SSEClient {
  private sources: Map<string, EventSource> = new Map();
  private handlers: Map<string, MessageHandler> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
  }

  subscribe(topic: string, onMessage: MessageHandler): () => void {
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
    const source = this.sources.get(topic);
    if (source) {
      source.close();
      this.sources.delete(topic);
      this.handlers.delete(topic);
      console.log(`Unsubscribed from topic "${topic}"`);
    }
  }

  unsubscribeAll() {
    for (const topic of this.sources.keys()) {
      this.unsubscribe(topic);
    }
  }
}
