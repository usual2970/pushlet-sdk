
export type ProtocolType = "ws" | "sse";

export type MessageHandler = (data: any) => void;

export abstract class PushletClient {
  protected sources: Map<string, EventSource> = new Map();
  protected handlers: Map<string, MessageHandler> = new Map();
  protected baseUrl: string;
  protected protocol: ProtocolType;
  protected wsConnection: WebSocket | null = null;
  protected pendingSubscriptions: Array<{
    topic: string;
    handler: MessageHandler;
  }> = [];

  constructor(baseUrl: string, protocol: ProtocolType = "sse") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
    this.protocol = protocol;
  }

  subscribe(topic: string, onMessage: MessageHandler): () => void {
    return this.toSubscribe(topic, onMessage);
  }

  unsubscribe(topic: string) {
    this.toUnsubscribe(topic);
  }

  unsubscribeAll() {
    for (const topic of this.sources.keys()) {
      this.toUnsubscribe(topic);
    }
  }

  abstract toSubscribe(topic: string, onMessage: MessageHandler): () => void;

  abstract toUnsubscribe(topic: string): void;
}
