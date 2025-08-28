"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WS = void 0;
const pushletClient_1 = require("./pushletClient");
const utils_1 = require("./utils");
class WS extends pushletClient_1.PushletClient {
    constructor(baseUrl, reconnectOptions, heartbeatOptions) {
        super(baseUrl, "ws", reconnectOptions, heartbeatOptions);
        this.wsReconnectTimer = null;
        this.wsReconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.heartbeatTimeoutTimer = null;
        this.lastPongTime = 0;
        this.networkStatusListener = null;
        this.setupNetworkStatusListeners();
    }
    setupNetworkStatusListeners() {
        // 监听网络状态变化
        if (typeof window !== "undefined") {
            this.networkStatusListener = () => {
                if (!navigator.onLine && this.wsConnection) {
                    console.log("Network offline detected, closing WebSocket connection");
                    this.wsConnection.close();
                }
                else if (navigator.onLine && this.handlers.size > 0) {
                    console.log("Network online detected, attempting to reconnect");
                    this.handleWsReconnect();
                }
            };
            window.addEventListener("offline", this.networkStatusListener);
            window.addEventListener("online", this.networkStatusListener);
        }
    }
    clearNetworkStatusListeners() {
        if (typeof window !== "undefined" && this.networkStatusListener) {
            window.removeEventListener("offline", this.networkStatusListener);
            window.removeEventListener("online", this.networkStatusListener);
            this.networkStatusListener = null;
        }
    }
    startHeartbeat() {
        if (!this.heartbeatOptions.enabled)
            return;
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            var _a;
            if (((_a = this.wsConnection) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                // 发送心跳消息
                this.wsConnection.send((0, utils_1.parseTextAsBinary)("PING"));
                // 设置心跳超时检测
                this.heartbeatTimeoutTimer = setTimeout(() => {
                    console.log("Heartbeat timeout, closing connection");
                    if (this.wsConnection) {
                        this.wsConnection.close();
                    }
                }, this.heartbeatOptions.timeout);
            }
        }, this.heartbeatOptions.interval);
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer);
            this.heartbeatTimeoutTimer = null;
        }
    }
    handlePong() {
        this.lastPongTime = Date.now();
        // 清除心跳超时定时器
        if (this.heartbeatTimeoutTimer) {
            clearTimeout(this.heartbeatTimeoutTimer);
            this.heartbeatTimeoutTimer = null;
        }
    }
    clearWsReconnectTimer() {
        if (this.wsReconnectTimer) {
            clearTimeout(this.wsReconnectTimer);
            this.wsReconnectTimer = null;
        }
    }
    shouldReconnectWs() {
        if (!this.reconnectOptions.enabled)
            return false;
        return this.wsReconnectAttempts < this.reconnectOptions.maxRetries;
    }
    handleWsReconnect() {
        if (!this.shouldReconnectWs()) {
            console.log(`Max WebSocket reconnect attempts reached (${this.reconnectOptions.maxRetries})`);
            return;
        }
        const delay = this.calculateRetryDelay(this.wsReconnectAttempts);
        this.wsReconnectAttempts++;
        console.log(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.wsReconnectAttempts}/${this.reconnectOptions.maxRetries})`);
        this.wsReconnectTimer = setTimeout(() => {
            this.wsReconnectTimer = null;
            console.log(`Reconnecting WebSocket...`);
            this.initWebSocket();
        }, delay);
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
            var _a;
            console.log("WebSocket connection established");
            // 判断是否为重连场景（在重置计数器之前）
            const isReconnecting = this.wsReconnectAttempts > 0;
            // 重置重连计数器
            this.wsReconnectAttempts = 0;
            this.clearWsReconnectTimer();
            // 启动心跳检测
            this.startHeartbeat();
            // 处理所有待发送的订阅消息
            this.pendingSubscriptions.forEach(({ topic }) => {
                var _a;
                if (((_a = this.wsConnection) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                    this.wsConnection.send((0, utils_1.parseTextAsBinary)(`SUB ${topic}`));
                }
            });
            // 如果是重连场景，需要重新订阅已有的主题（但要排除待处理队列中已经包含的）
            if (isReconnecting) {
                const pendingTopics = new Set(this.pendingSubscriptions.map((sub) => sub.topic));
                for (const topic of this.handlers.keys()) {
                    if (!pendingTopics.has(topic) &&
                        ((_a = this.wsConnection) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                        this.wsConnection.send((0, utils_1.parseTextAsBinary)(`SUB ${topic}`));
                    }
                }
            }
            this.pendingSubscriptions = [];
        };
        this.wsConnection.onmessage = (event) => {
            try {
                // 解析二进制消息格式，假设格式为 "TOPIC data"
                const message = (0, utils_1.parseBinaryAsText)(event.data);
                // 处理心跳响应
                if (message === "OK") {
                    this.handlePong();
                    return;
                }
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
        this.wsConnection.onclose = (event) => {
            console.log("WebSocket connection closed", event.code, event.reason);
            this.wsConnection = null;
            // 停止心跳检测
            this.stopHeartbeat();
            // 如果有活跃的订阅且需要重连，则尝试重连
            if (this.handlers.size > 0 && this.shouldReconnectWs()) {
                this.handleWsReconnect();
            }
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
            this.wsConnection.send((0, utils_1.parseTextAsBinary)(`SUB ${topic}`));
        }
        else {
            // 连接未打开，添加到待处理队列
            this.pendingSubscriptions.push({ topic, handler: onMessage });
        }
        // 返回一个取消订阅的函数
        return () => {
            if (this.wsConnection &&
                this.wsConnection.readyState === WebSocket.OPEN) {
                this.wsConnection.send((0, utils_1.parseTextAsBinary)(`UNSUB ${topic}`));
            }
            this.handlers.delete(topic);
            // 从待处理队列中移除
            this.pendingSubscriptions = this.pendingSubscriptions.filter((sub) => sub.topic !== topic);
        };
    }
    toUnsubscribe(topic) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send((0, utils_1.parseTextAsBinary)(`UNSUB ${topic}`));
        }
        this.handlers.delete(topic);
        // 如果没有活跃的订阅了，停止重连和心跳
        if (this.handlers.size === 0) {
            this.clearWsReconnectTimer();
            this.stopHeartbeat();
            this.wsReconnectAttempts = 0;
        }
        console.log(`Unsubscribed from WebSocket topic "${topic}"`);
    }
    // 清理资源的方法
    destroy() {
        // 清理所有订阅
        this.handlers.clear();
        this.pendingSubscriptions = [];
        // 关闭WebSocket连接
        if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
        }
        // 清理定时器
        this.clearWsReconnectTimer();
        this.stopHeartbeat();
        // 清理网络监听器
        this.clearNetworkStatusListeners();
        this.wsReconnectAttempts = 0;
    }
}
exports.WS = WS;
