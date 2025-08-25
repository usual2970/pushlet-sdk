import { SSE } from "./sse";
import { WS } from "./ws";
export type MessageHandler = (data: any) => void;
type ProtocolType = "ws" | "sse";
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
export declare function parseBinaryAsText(buffer: ArrayBuffer): string;
export declare function parseTextAsBinary(text: string): ArrayBuffer;
export declare const NewPushletClient: (baseUrl: string, protocol?: ProtocolType) => SSE | WS;
export {};
//# sourceMappingURL=index.d.ts.map