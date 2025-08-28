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
    interval: number;
    timeout: number;
}
export declare abstract class PushletClient {
    protected sources: Map<string, EventSource>;
    protected handlers: Map<string, MessageHandler>;
    protected baseUrl: string;
    protected protocol: ProtocolType;
    protected wsConnection: WebSocket | null;
    protected pendingSubscriptions: Array<{
        topic: string;
        handler: MessageHandler;
    }>;
    protected reconnectOptions: ReconnectOptions;
    protected heartbeatOptions: HeartbeatOptions;
    protected reconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
    protected reconnectAttempts: Map<string, number>;
    constructor(baseUrl: string, protocol?: ProtocolType, reconnectOptions?: Partial<ReconnectOptions>, heartbeatOptions?: Partial<HeartbeatOptions>);
    subscribe(topic: string, onMessage: MessageHandler): () => void;
    unsubscribe(topic: string): void;
    unsubscribeAll(): void;
    protected calculateRetryDelay(attempt: number): number;
    protected clearReconnectTimer(topic: string): void;
    protected shouldReconnect(topic: string): boolean;
    abstract toSubscribe(topic: string, onMessage: MessageHandler): () => void;
    abstract toUnsubscribe(topic: string): void;
}
//# sourceMappingURL=pushletClient.d.ts.map