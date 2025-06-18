type MessageHandler = (data: any) => void;
export declare class SSEClient {
    private sources;
    private handlers;
    private baseUrl;
    constructor(baseUrl: string);
    subscribe(topic: string, onMessage: MessageHandler): () => void;
    unsubscribe(topic: string): void;
    unsubscribeAll(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map