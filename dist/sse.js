"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSE = void 0;
const _1 = require(".");
class SSE extends _1.PushletClient {
    constructor(baseUrl) {
        super(baseUrl, "sse");
    }
    toSubscribe(topic, onMessage) {
        if (this.sources.has(topic)) {
            console.warn(`Already subscribed to topic "${topic}"`);
            // 即使已订阅，也返回一个可用的取消订阅函数
            return () => this.toUnsubscribe(topic);
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
        return () => this.toUnsubscribe(topic);
    }
    toUnsubscribe(topic) {
        const source = this.sources.get(topic);
        if (source) {
            source.close();
            this.sources.delete(topic);
            this.handlers.delete(topic);
            console.log(`Unsubscribed from topic "${topic}"`);
        }
    }
}
exports.SSE = SSE;
