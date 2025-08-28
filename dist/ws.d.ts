import { MessageHandler, PushletClient, ReconnectOptions, HeartbeatOptions } from "./pushletClient";
export declare class WS extends PushletClient {
    private wsReconnectTimer;
    private wsReconnectAttempts;
    private heartbeatTimer;
    private heartbeatTimeoutTimer;
    private lastPongTime;
    private networkStatusListener;
    constructor(baseUrl: string, reconnectOptions?: Partial<ReconnectOptions>, heartbeatOptions?: Partial<HeartbeatOptions>);
    private setupNetworkStatusListeners;
    private clearNetworkStatusListeners;
    private startHeartbeat;
    private stopHeartbeat;
    private handlePong;
    private clearWsReconnectTimer;
    private shouldReconnectWs;
    private handleWsReconnect;
    initWebSocket(): void;
    toSubscribe(topic: string, onMessage: MessageHandler): () => void;
    toUnsubscribe(topic: string): void;
    destroy(): void;
}
//# sourceMappingURL=ws.d.ts.map