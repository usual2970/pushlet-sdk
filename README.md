# Pushlet SDK

一个轻量级的 TypeScript SDK，用于通过服务器发送事件(SSE)订阅主题并接收实时消息。

## 特性

- 简单而强大的 API，用于订阅和取消订阅 SSE 主题
- 支持 JSON 和字符串格式的消息处理
- 自动错误处理和日志记录
- 返回清理函数，便于管理订阅生命周期
- 类型安全，提供完整的 TypeScript 类型定义
- 自动 URL 编码，支持包含特殊字符的主题名称

## 安装

使用 npm 安装:

```bash
npm install pushlet
```

或使用 yarn:

```bash
yarn add pushlet
```

## 基本用法

```typescript
import { PushletClient } from 'pushlet';

// 初始化客户端，指定 SSE 服务器端点
const client = new PushletClient('https://api.example.com/events');

// 订阅主题并处理收到的消息
const unsubscribe = client.subscribe('user-notifications', (data) => {
  console.log('收到新消息:', data);
});

// 当不再需要接收消息时，调用返回的函数来取消订阅
unsubscribe();

// 或者直接调用 unsubscribe 方法
// client.unsubscribe('user-notifications');
```

## 高级用法

```typescript
import { PushletClient } from 'pushlet';

// 初始化客户端
const client = new PushletClient('https://api.example.com/events');

// 订阅多个主题
const unsubscribeOrders = client.subscribe('orders', (data) => {
  console.log('新订单:', data);
});

const unsubscribeAlerts = client.subscribe('system-alerts', (data) => {
  console.log('系统警报:', data);
});

// 处理包含特殊字符的主题名称
const unsubscribeSpecial = client.subscribe('user/profile updates', (data) => {
  console.log('用户资料更新:', data);
});

// 组件卸载或页面关闭时取消所有订阅
function cleanup() {
  client.unsubscribeAll();
  // 或者单独取消特定订阅
  // unsubscribeOrders();
  // unsubscribeAlerts();
}

// 在 React 中使用
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    // 组件挂载时订阅
    const unsubscribe = client.subscribe('user-data', (data) => {
      console.log('用户数据更新:', data);
    });
    
    // 组件卸载时清理
    return unsubscribe;
  }, []);

  return <div>我的组件</div>;
}
```

## API 参考

### PushletClient

#### 构造函数

```typescript
constructor(baseUrl: string)
```

- `baseUrl`: SSE 服务器的基础 URL（尾部斜杠会被自动移除）

#### 方法

##### subscribe

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

##### unsubscribe

```typescript
unsubscribe(topic: string): void
```

取消订阅指定主题。

**参数:**
- `topic`: 要取消订阅的主题名称

**行为:**
- 关闭对应的 EventSource 连接
- 清理内部状态
- 打印取消订阅的日志信息

##### unsubscribeAll

```typescript
unsubscribeAll(): void
```

取消所有当前活跃的订阅。

**行为:**
- 遍历所有活跃订阅并逐一取消
- 清理所有内部状态

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

- **连接错误**: 自动记录到控制台，格式为 `SSE error on topic "${topic}":` 
- **JSON 解析错误**: 静默处理，将原始字符串传递给回调函数
- **重复订阅**: 打印警告信息但不会中断程序运行

## 注意事项

- 该 SDK 依赖浏览器原生的 `EventSource` API，在不支持的环境中可能需要使用 polyfill
- 主题名称会自动进行 URL 编码，支持包含空格和特殊字符的主题
- 客户端会自动移除 baseUrl 末尾的斜杠以确保 URL 格式正确
- 每个主题只能有一个活跃的订阅，重复订阅会产生警告

## 许可证

此项目采用 ISC 许可证

## 贡献

欢迎贡献代码和提出问题！请访问我们的 [GitHub 仓库](https://github.com/usual2970/pushlet-sdk)。