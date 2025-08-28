# Pushlet SDK

一个轻量级的 TypeScript SDK，同时支持服务器发送事件（SSE）和 WebSocket 协议来订阅主题并接收实时消息。

## 特性

- 🚀 **双协议支持**：同时支持 SSE 和 WebSocket 协议
- 📦 **轻量级设计**：最小化依赖，专注核心功能
- 🔒 **类型安全**：完整的 TypeScript 类型定义
- 🛠 **智能重连**：自动处理连接状态和重连逻辑
- 🎯 **简单易用**：统一的 API 接口，协议切换无缝
- 🔧 **灵活消息处理**：支持 JSON 和字符串格式的消息
- 📝 **自动日志**：内置错误处理和调试日志
- 🧹 **内存管理**：提供清理函数，防止内存泄漏

## 安装

使用 npm 安装:

```bash
npm install pushlet
```

或使用 yarn:

```bash
yarn add pushlet
```

## 快速开始

### SSE 模式（默认）

```typescript
import { NewPushletClient } from 'pushlet';

// 创建 SSE 客户端
const client = NewPushletClient('https://api.example.com/events');

// 订阅主题
const unsubscribe = client.subscribe('user-notifications', (data) => {
  console.log('收到新消息:', data);
});

// 取消订阅
unsubscribe();
```

### WebSocket 模式

```typescript
import { NewPushletClient } from 'pushlet';

// 创建 WebSocket 客户端
const client = NewPushletClient('ws://api.example.com/ws', 'ws');

// 订阅主题
const unsubscribe = client.subscribe('live-updates', (data) => {
  console.log('WebSocket 消息:', data);
});

// 取消订阅
unsubscribe();
```

## 断线重连配置

Pushlet SDK 提供了强大的断线重连功能，支持指数退避策略：

```typescript
import { NewPushletClient, ReconnectOptions } from 'pushlet';

// 自定义重连配置
const reconnectOptions: Partial<ReconnectOptions> = {
  enabled: true,           // 启用重连（默认: true）
  maxRetries: 10,         // 最大重试次数（默认: 5）
  retryDelay: 2000,       // 初始重连延迟，毫秒（默认: 1000）
  maxRetryDelay: 60000,   // 最大重连延迟，毫秒（默认: 30000）
  backoffMultiplier: 1.5  // 指数退避乘数（默认: 2）
};

// 创建带重连配置的客户端
const client = NewPushletClient(
  'https://api.example.com/events', 
  'sse', 
  reconnectOptions
);

// 订阅主题，SDK 会自动处理断线重连
const unsubscribe = client.subscribe('notifications', (data) => {
  console.log('收到消息:', data);
});
```

### 重连策略说明

- **指数退避**：重连延迟会按照 `retryDelay * backoffMultiplier^attempt` 计算
- **最大延迟限制**：重连延迟不会超过 `maxRetryDelay`
- **智能重连**：只有在有活跃订阅时才会尝试重连
- **自动恢复**：重连成功后会自动恢复所有订阅

## 高级用法

### 同时使用两种协议

```typescript
import { NewPushletClient } from 'pushlet';

// SSE 客户端用于接收通知
const notificationClient = NewPushletClient('https://api.example.com/events');
const notificationUnsub = notificationClient.subscribe('notifications', (data) => {
  console.log('通知:', data);
});

// WebSocket 客户端用于实时聊天
const chatClient = NewPushletClient('ws://api.example.com/chat', 'ws');
const chatUnsub = chatClient.subscribe('room-1', (data) => {
  console.log('聊天消息:', data);
});

// 清理资源
function cleanup() {
  notificationUnsub();
  chatUnsub();
}
```

### 处理多个主题

```typescript
import { NewPushletClient } from 'pushlet';

const client = NewPushletClient('https://api.example.com/events');

// 订阅多个主题
const unsubscribers = [
  client.subscribe('orders', (data) => console.log('新订单:', data)),
  client.subscribe('alerts', (data) => console.log('系统警报:', data)),
  client.subscribe('user/profile-updates', (data) => console.log('用户更新:', data))
];

// 批量取消订阅
function unsubscribeAll() {
  unsubscribers.forEach(unsub => unsub());
  // 或者使用客户端的批量取消方法
  client.unsubscribeAll();
}
```

### React 集成示例

```typescript
import React, { useEffect, useState } from 'react';
import { NewPushletClient } from 'pushlet';

function NotificationComponent() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const client = NewPushletClient('https://api.example.com/events');
    
    const unsubscribe = client.subscribe('user-notifications', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // 组件卸载时清理
    return unsubscribe;
  }, []);

  return (
    <div>
      {messages.map((msg, index) => (
        <div key={index}>{JSON.stringify(msg)}</div>
      ))}
    </div>
  );
}
```

### Vue 集成示例

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { NewPushletClient } from 'pushlet';

export default {
  setup() {
    const messages = ref([]);
    let unsubscribe;

    onMounted(() => {
      const client = NewPushletClient('ws://api.example.com/ws', 'ws');
      
      unsubscribe = client.subscribe('live-data', (data) => {
        messages.value.push(data);
      });
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    return { messages };
  }
};
```

## API 参考

### NewPushletClient

创建客户端实例的工厂函数。

```typescript
NewPushletClient(baseUrl: string, protocol?: ProtocolType): PushletClient
```

**参数:**

- `baseUrl`: 服务器的基础 URL
  - SSE 模式：HTTP/HTTPS URL（如：`https://api.example.com/events`）
  - WebSocket 模式：WebSocket URL（如：`ws://api.example.com/ws`）
- `protocol`: 协议类型，可选值为 `'sse'`（默认）或 `'ws'`

**返回值:**

- 返回一个 PushletClient 实例

### PushletClient 方法

#### subscribe

```typescript
subscribe(topic: string, onMessage: (data: any) => void): () => void
```

订阅指定主题并设置消息处理器。

**参数:**

- `topic`: 要订阅的主题名称（支持特殊字符，会自动进行 URL 编码）
- `onMessage`: 接收消息的回调函数，参数为解析后的数据

**返回值:**

- 返回一个取消订阅的函数

**行为:**

- 如果主题已经被订阅，会打印警告信息但仍返回有效的取消订阅函数
- 自动尝试将接收到的消息解析为 JSON，解析失败时传递原始字符串
- 连接错误会自动记录到控制台

#### unsubscribe

```typescript
unsubscribe(topic: string): void
```

取消订阅指定主题。

**参数:**

- `topic`: 要取消订阅的主题名称

**行为:**

- 关闭对应的连接
- 清理内部状态
- 打印取消订阅的日志信息

#### unsubscribeAll

```typescript
unsubscribeAll(): void
```

取消所有当前活跃的订阅。

**行为:**

- 遍历所有活跃订阅并逐一取消
- 清理所有内部状态

## 协议详情

### SSE 协议

- **连接方式**: HTTP 长连接
- **消息格式**: 标准的 SSE 格式
- **URL 格式**: `${baseUrl}?topic=${topic}`
- **重连**: 浏览器自动处理
- **适用场景**: 单向数据推送，如通知、实时更新

### WebSocket 协议

- **连接方式**: WebSocket 连接
- **消息格式**: 二进制文本消息
  - 订阅: `SUB ${topic}`
  - 取消订阅: `UNSUB ${topic}`
  - 接收消息: `${topic} ${data}`
- **重连**: 需要手动处理（未来版本将支持）
- **适用场景**: 双向通信，如聊天、实时协作

## 消息格式

SDK 会自动处理不同格式的消息：

```typescript
// JSON 格式消息会被自动解析
// 服务器发送: {"type": "notification", "message": "Hello"}
// 回调函数接收: {type: "notification", message: "Hello"}

// 纯文本消息会直接传递
// 服务器发送: "Hello World"
// 回调函数接收: "Hello World"
```

## 错误处理

SDK 内置了错误处理机制：

- **连接错误**: 自动记录到控制台，格式为 `SSE error on topic "${topic}":` 或 `WebSocket error:`
- **JSON 解析错误**: 静默处理，将原始字符串传递给回调函数
- **重复订阅**: 打印警告信息但不会中断程序运行

## 浏览器兼容性

- **SSE**: 支持所有现代浏览器（IE 不支持，需要 polyfill）
- **WebSocket**: 支持所有现代浏览器和 IE 10+

## 注意事项

- 该 SDK 依赖浏览器原生的 `EventSource` 和 `WebSocket` API
- SSE 模式下主题名称会自动进行 URL 编码，支持包含空格和特殊字符的主题
- WebSocket 模式下使用二进制文本消息格式
- 客户端会自动移除 baseUrl 末尾的斜杠以确保 URL 格式正确
- 每个主题只能有一个活跃的订阅，重复订阅会产生警告

## 许可证

此项目采用 ISC 许可证

## 贡献

欢迎贡献代码和提出问题！请访问我们的 [GitHub 仓库](https://github.com/usual2970/pushlet-sdk)。