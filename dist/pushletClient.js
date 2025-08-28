"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushletClient = void 0;
class PushletClient {
    constructor(baseUrl, protocol = "sse", reconnectOptions, heartbeatOptions) {
        this.sources = new Map();
        this.handlers = new Map();
        this.wsConnection = null;
        this.pendingSubscriptions = [];
        this.reconnectTimers = new Map();
        this.reconnectAttempts = new Map();
        this.baseUrl = baseUrl.replace(/\/$/, ""); // remove trailing slash
        this.protocol = protocol;
        this.reconnectOptions = Object.assign({ enabled: true, maxRetries: 5, retryDelay: 1000, maxRetryDelay: 30000, backoffMultiplier: 2 }, reconnectOptions);
        this.heartbeatOptions = Object.assign({ enabled: true, interval: 30000, timeout: 10000 }, heartbeatOptions);
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
    calculateRetryDelay(attempt) {
        const delay = this.reconnectOptions.retryDelay *
            Math.pow(this.reconnectOptions.backoffMultiplier, attempt);
        return Math.min(delay, this.reconnectOptions.maxRetryDelay);
    }
    clearReconnectTimer(topic) {
        const timer = this.reconnectTimers.get(topic);
        if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(topic);
        }
    }
    shouldReconnect(topic) {
        if (!this.reconnectOptions.enabled)
            return false;
        const attempts = this.reconnectAttempts.get(topic) || 0;
        return attempts < this.reconnectOptions.maxRetries;
    }
}
exports.PushletClient = PushletClient;
