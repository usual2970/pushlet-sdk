"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushletClient = void 0;
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
