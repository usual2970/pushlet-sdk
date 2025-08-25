export type ProtocolType = "ws" | "sse";
export type MessageHandler = (data: any) => void;
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
    constructor(baseUrl: string, protocol?: ProtocolType);
    subscribe(topic: string, onMessage: MessageHandler): () => void;
    unsubscribe(topic: string): void;
    unsubscribeAll(): void;
    abstract toSubscribe(topic: string, onMessage: MessageHandler): () => void;
    abstract toUnsubscribe(topic: string): void;
}
//# sourceMappingURL=pushletClient.d.ts.map