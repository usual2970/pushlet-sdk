type MessageHandler = (data: any) => void;
type ProtocolType = "ws" | "sse";
export declare class PushletClient {
    private sources;
    private handlers;
    private baseUrl;
    private protocol;
    private wsConnection;
    constructor(baseUrl: string, protocol?: ProtocolType);
    initWebSocket(): void;
    subscribe(topic: string, onMessage: MessageHandler): () => void;
    unsubscribe(topic: string): void;
    unsubscribeAll(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map