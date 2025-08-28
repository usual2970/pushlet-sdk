import { MessageHandler, PushletClient, ReconnectOptions, HeartbeatOptions } from "./pushletClient";
export declare class SSE extends PushletClient {
    constructor(baseUrl: string, reconnectOptions?: Partial<ReconnectOptions>, heartbeatOptions?: Partial<HeartbeatOptions>);
    private createEventSource;
    private handleReconnect;
    toSubscribe(topic: string, onMessage: MessageHandler): () => void;
    toUnsubscribe(topic: string): void;
}
//# sourceMappingURL=sse.d.ts.map