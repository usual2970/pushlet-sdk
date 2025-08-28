"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBinaryAsText = parseBinaryAsText;
exports.parseTextAsBinary = parseTextAsBinary;
function parseBinaryAsText(buffer) {
    const decoder = new TextDecoder(); // 默认就是 utf-8
    return decoder.decode(new Uint8Array(buffer));
}
function parseTextAsBinary(text) {
    const encoder = new TextEncoder(); // 默认就是 utf-8
    return encoder.encode(text).buffer;
}
