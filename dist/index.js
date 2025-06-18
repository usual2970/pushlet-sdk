"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushletClient = void 0;
class PushletClient {
    constructor(baseUrl) {
        this.sources = new Map();
        this.handlers = new Map();
        this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
    }
    subscribe(topic, onMessage) {
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
        const source = this.sources.get(topic);
        if (source) {
            source.close();
            this.sources.delete(topic);
            this.handlers.delete(topic);
            console.log(`Unsubscribed from topic "${topic}"`);
        }
    }
    unsubscribeAll() {
        for (const topic of this.sources.keys()) {
            this.unsubscribe(topic);
        }
    }
}
exports.PushletClient = PushletClient;
