import {
  ProtocolType,
  ReconnectOptions,
  HeartbeatOptions,
} from "./pushletClient";
import { SSE } from "./sse";
import { WS } from "./ws";

// 重新导出所有主要类型和类
export {
  PushletClient,
  MessageHandler,
  ProtocolType,
  ReconnectOptions,
  HeartbeatOptions,
} from "./pushletClient";
export { SSE } from "./sse";
export { WS } from "./ws";
export { parseBinaryAsText, parseTextAsBinary } from "./utils";

export const NewPushletClient = (
  baseUrl: string,
  protocol: ProtocolType = "sse",
  reconnectOptions?: Partial<ReconnectOptions>,
  heartbeatOptions?: Partial<HeartbeatOptions>
) => {
  if (protocol === "ws") {
    return new WS(baseUrl, reconnectOptions, heartbeatOptions);
  }
  return new SSE(baseUrl, reconnectOptions, heartbeatOptions);
};
