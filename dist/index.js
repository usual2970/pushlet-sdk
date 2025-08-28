"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewPushletClient = exports.parseTextAsBinary = exports.parseBinaryAsText = exports.WS = exports.SSE = exports.PushletClient = void 0;
const sse_1 = require("./sse");
const ws_1 = require("./ws");
// 重新导出所有主要类型和类
var pushletClient_1 = require("./pushletClient");
Object.defineProperty(exports, "PushletClient", { enumerable: true, get: function () { return pushletClient_1.PushletClient; } });
var sse_2 = require("./sse");
Object.defineProperty(exports, "SSE", { enumerable: true, get: function () { return sse_2.SSE; } });
var ws_2 = require("./ws");
Object.defineProperty(exports, "WS", { enumerable: true, get: function () { return ws_2.WS; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "parseBinaryAsText", { enumerable: true, get: function () { return utils_1.parseBinaryAsText; } });
Object.defineProperty(exports, "parseTextAsBinary", { enumerable: true, get: function () { return utils_1.parseTextAsBinary; } });
const NewPushletClient = (baseUrl, protocol = "sse", reconnectOptions, heartbeatOptions) => {
    if (protocol === "ws") {
        return new ws_1.WS(baseUrl, reconnectOptions, heartbeatOptions);
    }
    return new sse_1.SSE(baseUrl, reconnectOptions, heartbeatOptions);
};
exports.NewPushletClient = NewPushletClient;
