export function parseBinaryAsText(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder(); // 默认就是 utf-8
  return decoder.decode(new Uint8Array(buffer));
}

export function parseTextAsBinary(text: string): ArrayBuffer {
  const encoder = new TextEncoder(); // 默认就是 utf-8
  return encoder.encode(text).buffer;
}
