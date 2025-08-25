"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewPushletClient = void 0;
const sse_1 = require("./sse");
const ws_1 = require("./ws");
const NewPushletClient = (baseUrl, protocol = "sse") => {
    if (protocol === "ws") {
        return new ws_1.WS(baseUrl);
    }
    return new sse_1.SSE(baseUrl);
};
exports.NewPushletClient = NewPushletClient;
