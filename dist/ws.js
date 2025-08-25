"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS = void 0;
const _1 = require(".");
class WS extends _1.PushletClient {
    constructor(baseUrl) {
        super(baseUrl, "ws");
    }
    initWebSocket() {
        // 检查是否已经有连接存在（包括正在连接的状态）
        if (this.wsConnection &&
            (this.wsConnection.readyState === WebSocket.CONNECTING ||
                this.wsConnection.readyState === WebSocket.OPEN)) {
            return;
        }
        this.wsConnection = new WebSocket(this.baseUrl);
        this.wsConnection.binaryType = "arraybuffer";
        this.wsConnection.onopen = () => {
            console.log("WebSocket connection established");
            // 处理所有待发送的订阅消息
            this.pendingSubscriptions.forEach(({ topic }) => {
                var _a;
                if (((_a = this.wsConnection) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                    this.wsConnection.send((0, _1.parseTextAsBinary)(`SUB ${topic}`));
                }
            });
            this.pendingSubscriptions = [];
        };
        this.wsConnection.onmessage = (event) => {
            try {
                // 解析二进制消息格式，假设格式为 "TOPIC data"
                const message = (0, _1.parseBinaryAsText)(event.data);
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
            this.wsConnection = null;
        };
    }
    toSubscribe(topic, onMessage) {
        var _a;
        this.initWebSocket();
        if (this.handlers.has(topic)) {
            console.warn(`Already subscribed to topic "${topic}"`);
        }
        this.handlers.set(topic, onMessage);
        // 发送订阅消息
        if (((_a = this.wsConnection) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            // 连接已打开，直接发送
            this.wsConnection.send((0, _1.parseTextAsBinary)(`SUB ${topic}`));
        }
        else {
            // 连接未打开，添加到待处理队列
            this.pendingSubscriptions.push({ topic, handler: onMessage });
        }
        // 返回一个取消订阅的函数
        return () => {
            if (this.wsConnection &&
                this.wsConnection.readyState === WebSocket.OPEN) {
                this.wsConnection.send((0, _1.parseTextAsBinary)(`UNSUB ${topic}`));
            }
            this.handlers.delete(topic);
            // 从待处理队列中移除
            this.pendingSubscriptions = this.pendingSubscriptions.filter((sub) => sub.topic !== topic);
        };
    }
    toUnsubscribe(topic) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send((0, _1.parseTextAsBinary)(`UNSUB ${topic}`));
        }
        this.handlers.delete(topic);
        console.log(`Unsubscribed from WebSocket topic "${topic}"`);
    }
}
exports.WS = WS;
