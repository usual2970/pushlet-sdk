"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewPushletClient = exports.PushletClient = void 0;
exports.parseBinaryAsText = parseBinaryAsText;
exports.parseTextAsBinary = parseTextAsBinary;
const sse_1 = require("./sse");
const ws_1 = require("./ws");
class PushletClient {
    constructor(baseUrl, protocol = "sse") {
        this.sources = new Map();
        this.handlers = new Map();
        this.wsConnection = null;
        this.pendingSubscriptions = [];
        this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
        this.protocol = protocol;
    }
    subscribe(topic, onMessage) {
        return this.toSubscribe(topic, onMessage);
    }
    unsubscribe(topic) {
        this.toUnsubscribe(topic);
    }
    unsubscribeAll() {
        for (const topic of this.sources.keys()) {
            this.toUnsubscribe(topic);
        }
    }
}
exports.PushletClient = PushletClient;
function parseBinaryAsText(buffer) {
    const decoder = new TextDecoder(); // 默认就是 utf-8
    return decoder.decode(new Uint8Array(buffer));
}
function parseTextAsBinary(text) {
    const encoder = new TextEncoder(); // 默认就是 utf-8
    return encoder.encode(text).buffer;
}
const NewPushletClient = (baseUrl, protocol = "sse") => {
    if (protocol === "ws") {
        return new ws_1.WS(baseUrl);
    }
    return new sse_1.SSE(baseUrl);
};
exports.NewPushletClient = NewPushletClient;
