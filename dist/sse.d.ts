import { MessageHandler, PushletClient } from ".";
export declare class SSE extends PushletClient {
    constructor(baseUrl: string);
    toSubscribe(topic: string, onMessage: MessageHandler): () => void;
    toUnsubscribe(topic: string): void;
}
//# sourceMappingURL=sse.d.ts.map