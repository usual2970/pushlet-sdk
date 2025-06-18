# sse-subscription-sdk

This SDK provides a simple interface for subscribing to server-sent events (SSE) and managing topics. It allows clients to receive real-time updates from the server and manage their subscriptions effectively.

## Features

- Subscribe to specific topics to receive messages.
- Unsubscribe from topics when no longer needed.
- Manage subscription states with a dedicated TopicManager.
- Built-in error handling and logging utilities.

## Installation

To install the SDK, use npm:

```
npm install sse-subscription-sdk
```

## Usage

### Basic Usage

Here is a simple example of how to use the SDK:

```typescript
import { SSEClient } from 'sse-subscription-sdk';

const client = new SSEClient();

client.subscribe('topic1', (message) => {
  console.log('Received message:', message);
});
```

### Advanced Usage

For more advanced scenarios, you can manage multiple topics and handle errors:

```typescript
import { SSEClient } from 'sse-subscription-sdk';

const client = new SSEClient();

client.subscribe('topic1', (message) => {
  console.log('Received message from topic1:', message);
});

client.subscribe('topic2', (message) => {
  console.log('Received message from topic2:', message);
});

// Unsubscribe from a topic
client.unsubscribe('topic1');
```

## API Reference

### SSEClient

- `subscribe(topic: string, callback: Function)`: Subscribes to a topic and sets a callback to handle incoming messages.
- `unsubscribe(topic: string)`: Unsubscribes from a specified topic.

### TopicManager

- `addTopic(topic: string)`: Adds a topic to the subscription list.
- `removeTopic(topic: string)`: Removes a topic from the subscription list.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the ISC License.