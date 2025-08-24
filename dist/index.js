"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushletClient = void 0;
class PushletClient {
    constructor(baseUrl, protocol = "sse") {
        this.sources = new Map();
        this.handlers = new Map();
        this.wsConnection = null;
        this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
        this.protocol = protocol;
    }
    initWebSocket() {
        if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
            this.wsConnection = new WebSocket(this.baseUrl);
            this.wsConnection.onopen = () => {
                console.log("WebSocket connection established");
            };
            this.wsConnection.onmessage = (event) => {
                try {
                    // 解析二进制消息格式，假设格式为 "TOPIC data"
                    const message = parseBinaryAsText(event.data);
                    const parts = message.split(" ", 2);
                    if (parts.length >= 2) {
                        const topic = parts[0];
                        const data = message.substring(parts[0].length + 1);
                        const handler = this.handlers.get(topic);
                        if (handler) {
                            try {
                                // 尝试解析为 JSON
                                const jsonData = JSON.parse(data);
                                handler(jsonData);
                            }
                            catch (_a) {
                                // 解析失败则传递原始字符串
                                handler(data);
                            }
                        }
                    }
                }
                catch (err) {
                    console.error("Error parsing WebSocket message:", err);
                }
            };
            this.wsConnection.onerror = (err) => {
                console.error("WebSocket error:", err);
            };
            this.wsConnection.onclose = () => {
                console.log("WebSocket connection closed");
            };
        }
    }
    subscribe(topic, onMessage) {
        var _a, _b;
        if (this.protocol == "ws") {
            this.initWebSocket();
            // 发送二进制订阅消息：'SUB TOPIC'
            if (((_a = this.wsConnection) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                this.wsConnection.send(parseTextAsBinary(`SUB ${topic}`));
            }
            else {
                // 如果连接还未建立，等待连接打开后再发送
                (_b = this.wsConnection) === null || _b === void 0 ? void 0 : _b.addEventListener("open", () => {
                    var _a;
                    (_a = this.wsConnection) === null || _a === void 0 ? void 0 : _a.send(parseTextAsBinary(`SUB ${topic}`));
                });
            }
            if (this.handlers.has(topic)) {
                console.warn(`Already subscribed to topic "${topic}"`);
            }
            this.handlers.set(topic, onMessage);
            // 返回一个取消订阅的函数
            return () => {
                if (this.wsConnection &&
                    this.wsConnection.readyState === WebSocket.OPEN) {
                    this.wsConnection.send(parseTextAsBinary(`UNSUB ${topic}`));
                }
                this.handlers.delete(topic);
            };
        }
        if (this.sources.has(topic)) {
            console.warn(`Already subscribed to topic "${topic}"`);
            // 即使已订阅，也返回一个可用的取消订阅函数
            return () => this.unsubscribe(topic);
        }
        const url = `${this.baseUrl}?topic=${encodeURIComponent(topic)}`;
        const source = new EventSource(url);
        source.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            }
            catch (_a) {
                onMessage(event.data); // fallback
            }
        };
        source.onerror = (err) => {
            console.error(`SSE error on topic "${topic}":`, err);
        };
        this.sources.set(topic, source);
        this.handlers.set(topic, onMessage);
        // 返回一个取消订阅的函数
        return () => this.unsubscribe(topic);
    }
    unsubscribe(topic) {
        if (this.protocol === "ws") {
            // WebSocket 模式下发送取消订阅消息
            if (this.wsConnection &&
                this.wsConnection.readyState === WebSocket.OPEN) {
                this.wsConnection.send(parseTextAsBinary(`UNSUB ${topic}`));
            }
            this.handlers.delete(topic);
            console.log(`Unsubscribed from WebSocket topic "${topic}"`);
            return;
        }
        // SSE 模式下的取消订阅逻辑
        const source = this.sources.get(topic);
        if (source) {
            source.close();
            this.sources.delete(topic);
            this.handlers.delete(topic);
            console.log(`Unsubscribed from topic "${topic}"`);
        }
    }
    unsubscribeAll() {
        if (this.protocol === "ws") {
            // WebSocket 模式下取消所有订阅
            for (const topic of this.handlers.keys()) {
                this.unsubscribe(topic);
            }
            return;
        }
        // SSE 模式下取消所有订阅
        for (const topic of this.sources.keys()) {
            this.unsubscribe(topic);
        }
    }
}
exports.PushletClient = PushletClient;
function parseBinaryAsText(buffer) {
    const decoder = new TextDecoder("utf-8"); // 默认就是 utf-8
    return decoder.decode(new Uint8Array(buffer));
}
function parseTextAsBinary(text) {
    const encoder = new TextEncoder(); // 默认就是 utf-8
    return encoder.encode(text).buffer;
}
