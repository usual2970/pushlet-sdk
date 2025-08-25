import { SSE } from "./sse";
import { WS } from "./ws";

export type MessageHandler = (data: any) => void;

type ProtocolType = "ws" | "sse";
export abstract class PushletClient {
  protected sources: Map<string, EventSource> = new Map();
  protected handlers: Map<string, MessageHandler> = new Map();
  protected baseUrl: string;
  protected protocol: ProtocolType;
  protected wsConnection: WebSocket | null = null;
  protected pendingSubscriptions: Array<{
    topic: string;
    handler: MessageHandler;
  }> = [];

  constructor(baseUrl: string, protocol: ProtocolType = "sse") {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
    this.protocol = protocol;
  }

  subscribe(topic: string, onMessage: MessageHandler): () => void {
    return this.toSubscribe(topic, onMessage);
  }

  unsubscribe(topic: string) {
    this.toUnsubscribe(topic);
  }

  unsubscribeAll() {
    for (const topic of this.sources.keys()) {
      this.toUnsubscribe(topic);
    }
  }

  abstract toSubscribe(topic: string, onMessage: MessageHandler): () => void;

  abstract toUnsubscribe(topic: string): void;
}

export function parseBinaryAsText(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder(); // 默认就是 utf-8
  return decoder.decode(new Uint8Array(buffer));
}

export function parseTextAsBinary(text: string): ArrayBuffer {
  const encoder = new TextEncoder(); // 默认就是 utf-8
  return encoder.encode(text).buffer;
}

export const NewPushletClient = (
  baseUrl: string,
  protocol: ProtocolType = "sse"
) => {
  if (protocol === "ws") {
    return new WS(baseUrl);
  }
  return new SSE(baseUrl);
};
