import { ProtocolType } from "./pushletClient";
import { SSE } from "./sse";
import { WS } from "./ws";

export const NewPushletClient = (
  baseUrl: string,
  protocol: ProtocolType = "sse"
) => {
  if (protocol === "ws") {
    return new WS(baseUrl);
  }
  return new SSE(baseUrl);
};
