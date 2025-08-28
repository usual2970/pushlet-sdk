import { ProtocolType, ReconnectOptions, HeartbeatOptions } from "./pushletClient";
import { SSE } from "./sse";
import { WS } from "./ws";
export { PushletClient, MessageHandler, ProtocolType, ReconnectOptions, HeartbeatOptions, } from "./pushletClient";
export { SSE } from "./sse";
export { WS } from "./ws";
export { parseBinaryAsText, parseTextAsBinary } from "./utils";
export declare const NewPushletClient: (baseUrl: string, protocol?: ProtocolType, reconnectOptions?: Partial<ReconnectOptions>, heartbeatOptions?: Partial<HeartbeatOptions>) => SSE | WS;
//# sourceMappingURL=index.d.ts.map