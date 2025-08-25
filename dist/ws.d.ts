import { MessageHandler, PushletClient } from "./pushletClient";
export declare class WS extends PushletClient {
    constructor(baseUrl: string);
    initWebSocket(): void;
    toSubscribe(topic: string, onMessage: MessageHandler): () => void;
    toUnsubscribe(topic: string): void;
}
//# sourceMappingURL=ws.d.ts.map