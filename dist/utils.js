"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTextAsBinary = exports.parseBinaryAsText = void 0;
function parseBinaryAsText(buffer) {
    const decoder = new TextDecoder(); // 默认就是 utf-8
    return decoder.decode(new Uint8Array(buffer));
}
exports.parseBinaryAsText = parseBinaryAsText;
function parseTextAsBinary(text) {
    const encoder = new TextEncoder(); // 默认就是 utf-8
    return encoder.encode(text).buffer;
}
exports.parseTextAsBinary = parseTextAsBinary;
