export type ProtocolType = "ws" | "sse";

export type MessageHandler = (data: any) => void;

export interface ReconnectOptions {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  maxRetryDelay: number;
  backoffMultiplier: number;
}

export interface HeartbeatOptions {
  enabled: boolean;
  interval: number; // 心跳间隔（毫秒）
  timeout: number; // 心跳超时时间（毫秒）
}

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
  protected reconnectOptions: ReconnectOptions;
  protected heartbeatOptions: HeartbeatOptions;
  protected reconnectTimers: Map<string, ReturnType<typeof setTimeout>> =
    new Map();
  protected reconnectAttempts: Map<string, number> = new Map();

  constructor(
    baseUrl: string,
    protocol: ProtocolType = "sse",
    reconnectOptions?: Partial<ReconnectOptions>,
    heartbeatOptions?: Partial<HeartbeatOptions>
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
    this.protocol = protocol;
    this.reconnectOptions = {
      enabled: true,
      maxRetries: 5,
      retryDelay: 1000,
      maxRetryDelay: 30000,
      backoffMultiplier: 2,
      ...reconnectOptions,
    };
    this.heartbeatOptions = {
      enabled: true,
      interval: 30000, // 30秒发送一次心跳
      timeout: 10000, // 10秒心跳超时
      ...heartbeatOptions,
    };
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

  protected calculateRetryDelay(attempt: number): number {
    const delay =
      this.reconnectOptions.retryDelay *
      Math.pow(this.reconnectOptions.backoffMultiplier, attempt);
    return Math.min(delay, this.reconnectOptions.maxRetryDelay);
  }

  protected clearReconnectTimer(topic: string): void {
    const timer = this.reconnectTimers.get(topic);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(topic);
    }
  }

  protected shouldReconnect(topic: string): boolean {
    if (!this.reconnectOptions.enabled) return false;
    const attempts = this.reconnectAttempts.get(topic) || 0;
    return attempts < this.reconnectOptions.maxRetries;
  }

  abstract toSubscribe(topic: string, onMessage: MessageHandler): () => void;

  abstract toUnsubscribe(topic: string): void;
}
