import { SSEClient } from '../src/client';
import { TopicManager } from '../src/subscription';

// Initialize the SSEClient
const sseClient = new SSEClient();

// Initialize the TopicManager
const topicManager = new TopicManager();

// Define a topic to subscribe to
const topic = 'example-topic';

// Subscribe to the topic
sseClient.subscribe(topic, (message) => {
    console.log(`Received message on topic "${topic}":`, message);
});

// Add the topic to the TopicManager
topicManager.addTopic(topic);

// Example of unsubscribing after some time
setTimeout(() => {
    sseClient.unsubscribe(topic);
    topicManager.removeTopic(topic);
    console.log(`Unsubscribed from topic "${topic}"`);
}, 10000); // Unsubscribe after 10 seconds