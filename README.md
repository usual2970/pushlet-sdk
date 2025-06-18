# sse-subscription-sdk

一个轻量级的 TypeScript SDK，用于通过服务器发送事件(SSE)订阅主题并接收实时消息。

## 特性

- 简单而强大的 API，用于订阅和取消订阅 SSE 主题
- 支持 JSON 和字符串格式的消息处理
- 自动错误处理和日志记录
- 返回清理函数，便于管理订阅生命周期
- 类型安全，提供完整的 TypeScript 类型定义

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
import { SSEClient } from 'pushlet';

// 初始化客户端，指定 SSE 服务器端点
const client = new SSEClient('https://api.example.com/events');

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
import { SSEClient } from 'pushlet';

// 初始化客户端
const client = new SSEClient('https://api.example.com/events');

// 订阅多个主题
const unsubscribeOrders = client.subscribe('orders', (data) => {
  console.log('新订单:', data);
});

const unsubscribeAlerts = client.subscribe('system-alerts', (data) => {
  console.log('系统警报:', data);
});

// 组件卸载或页面关闭时取消所有订阅
function cleanup() {
  client.unsubscribeAll();
  // 或者单独取消特定订阅
  // unsubscribeOrders();
  // unsubscribeAlerts();
}

// 在 React 中使用
useEffect(() => {
  // 组件挂载时订阅
  const unsubscribe = client.subscribe('user-data', handleMessage);
  
  // 组件卸载时清理
  return unsubscribe;
}, []);
```

## API 参考

### SSEClient

#### 构造函数

```typescript
constructor(baseUrl: string)
```

- `baseUrl`: SSE 服务器的基础 URL

#### 方法

##### subscribe

```typescript
subscribe(topic: string, onMessage: (data: any) => void): () => void
```

- `topic`: 要订阅的主题名称
- `onMessage`: 接收消息的回调函数
- 返回一个取消订阅的函数

##### unsubscribe

```typescript
unsubscribe(topic: string): void
```

- `topic`: 要取消订阅的主题名称

##### unsubscribeAll

```typescript
unsubscribeAll(): void
```

- 取消所有当前活跃的订阅

## 注意事项

- 该 SDK 依赖浏览器原生的 `EventSource` API，在不支持的环境中可能需要使用 polyfill
- 默认情况下，SDK 会尝试将接收到的消息解析为 JSON，如果解析失败则会将原始字符串传递给回调函数

## 许可证

此项目采用 ISC 许可证

## 贡献

欢迎贡献代码和提出问题！请访问我们的 [GitHub 仓库](https://github.com/usual2970/pushlet-sdk)。