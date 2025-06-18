import { SSEClient } from '../src/client';
import { TopicManager } from '../src/subscription';

const client = new SSEClient('https://your-server-url/sse');
const topicManager = new TopicManager();

const topics = ['topic1', 'topic2', 'topic3'];

topics.forEach(topic => {
    topicManager.addTopic(topic);
    client.subscribe(topic, (message) => {
        console.log(`Received message from ${topic}:`, message);
    });
});

// Error handling example
client.onError((error) => {
    console.error('Error occurred:', error);
});

// Unsubscribe from a topic after some time
setTimeout(() => {
    const topicToUnsubscribe = 'topic1';
    client.unsubscribe(topicToUnsubscribe);
    topicManager.removeTopic(topicToUnsubscribe);
    console.log(`Unsubscribed from ${topicToUnsubscribe}`);
}, 10000); // Unsubscribe after 10 seconds