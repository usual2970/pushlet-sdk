import { SSEClient } from '../src';

// Mock EventSource globally
class MockEventSource {
    onmessage: ((event: any) => void) | null = null;
    onerror: ((error: any) => void) | null = null;
    url: string;
    readyState: number = 0;

    constructor(url: string) {
        this.url = url;
    }

    close() {
        this.readyState = 2;
    }

    // Helper to simulate message events
    simulateMessage(data: any) {
        if (this.onmessage) {
            this.onmessage({ data: typeof data === 'object' ? JSON.stringify(data) : data });
        }
    }

    // Helper to simulate error events
    simulateError(error: any) {
        if (this.onerror) {
            this.onerror(error);
        }
    }
}

// Replace global EventSource with mock
(global as any).EventSource = MockEventSource;

// Spy on console methods
console.warn = jest.fn();
console.error = jest.fn();
console.log = jest.fn();

describe('SSEClient', () => {
    let client: SSEClient;
    
    beforeEach(() => {
        client = new SSEClient('https://api.example.com/events');
        jest.clearAllMocks();
    });

    afterEach(() => {
        client.unsubscribeAll();
    });

    test('constructor should remove trailing slash from baseUrl', () => {
        const clientWithSlash = new SSEClient('https://api.example.com/events/');
        const clientWithoutSlash = new SSEClient('https://api.example.com/events');
        
        // Subscribe to create a source with the URL
        const handler = jest.fn();
        clientWithSlash.subscribe('test', handler);
        clientWithoutSlash.subscribe('test', handler);
        
        const sourceWithSlash = (clientWithSlash as any).sources.get('test');
        const sourceWithoutSlash = (clientWithoutSlash as any).sources.get('test');
        
        expect(sourceWithSlash.url).toBe('https://api.example.com/events?topic=test');
        expect(sourceWithoutSlash.url).toBe('https://api.example.com/events?topic=test');
    });

    test('subscribe should create an EventSource with correct URL', () => {
        const handler = jest.fn();
        client.subscribe('test-topic', handler);
        
        const source = (client as any).sources.get('test-topic');
        expect(source).toBeDefined();
        expect(source.url).toBe('https://api.example.com/events?topic=test-topic');
    });

    test('subscribe should handle URL encoding for topic names', () => {
        const handler = jest.fn();
        client.subscribe('test/topic with spaces', handler);
        
        const source = (client as any).sources.get('test/topic with spaces');
        expect(source.url).toBe('https://api.example.com/events?topic=test%2Ftopic%20with%20spaces');
    });

    test('subscribe should handle JSON message data', () => {
        const handler = jest.fn();
        const unsubscribe = client.subscribe('test-topic', handler);
        
        const source = (client as any).sources.get('test-topic');
        source.simulateMessage({ foo: 'bar' });
        
        expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
        unsubscribe();
    });

    test('subscribe should handle string message data as fallback', () => {
        const handler = jest.fn();
        client.subscribe('test-topic', handler);
        
        const source = (client as any).sources.get('test-topic');
        source.simulateMessage('plain text message');
        
        expect(handler).toHaveBeenCalledWith('plain text message');
    });

    test('subscribe should warn if already subscribed to topic', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        
        client.subscribe('test-topic', handler1);
        client.subscribe('test-topic', handler2);
        
        expect(console.warn).toHaveBeenCalledWith('Already subscribed to topic "test-topic"');
    });

    test('subscribe should return unsubscribe function', () => {
        const handler = jest.fn();
        const unsubscribe = client.subscribe('test-topic', handler);
        
        expect(typeof unsubscribe).toBe('function');
        
        unsubscribe();
        expect((client as any).sources.has('test-topic')).toBe(false);
        expect((client as any).handlers.has('test-topic')).toBe(false);
    });

    test('error handling should log to console', () => {
        const handler = jest.fn();
        client.subscribe('test-topic', handler);
        
        const source = (client as any).sources.get('test-topic');
        const error = new Error('Connection failed');
        source.simulateError(error);
        
        expect(console.error).toHaveBeenCalledWith(
            'SSE error on topic "test-topic":', 
            error
        );
    });

    test('unsubscribe should close event source and remove handlers', () => {
        const handler = jest.fn();
        client.subscribe('test-topic', handler);
        
        const source = (client as any).sources.get('test-topic');
        const closeSpy = jest.spyOn(source, 'close');
        
        client.unsubscribe('test-topic');
        
        expect(closeSpy).toHaveBeenCalled();
        expect((client as any).sources.has('test-topic')).toBe(false);
        expect((client as any).handlers.has('test-topic')).toBe(false);
        expect(console.log).toHaveBeenCalledWith('Unsubscribed from topic "test-topic"');
    });

    test('unsubscribe should do nothing for non-existent topics', () => {
        client.unsubscribe('non-existent-topic');
        expect(console.log).not.toHaveBeenCalled();
    });

    test('unsubscribeAll should unsubscribe from all topics', () => {
        client.subscribe('topic1', jest.fn());
        client.subscribe('topic2', jest.fn());
        client.subscribe('topic3', jest.fn());
        
        client.unsubscribeAll();
        
        expect((client as any).sources.size).toBe(0);
        expect((client as any).handlers.size).toBe(0);
        expect(console.log).toHaveBeenCalledTimes(3);
    });
});