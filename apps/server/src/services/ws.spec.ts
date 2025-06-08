import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Server as WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';

// Mock dependencies
vi.mock('./log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

vi.mock('./sync_mutex.js', () => ({
    default: {
        doExclusively: vi.fn().mockImplementation((fn) => fn())
    }
}));

vi.mock('./sql.js', () => ({
    getManyRows: vi.fn(),
    getValue: vi.fn(),
    getRow: vi.fn()
}));

vi.mock('../becca/becca.js', () => ({
    default: {
        getAttribute: vi.fn(),
        getBranch: vi.fn(),
        getNote: vi.fn(),
        getOption: vi.fn()
    }
}));

vi.mock('./protected_session.js', () => ({
    default: {
        decryptString: vi.fn((str) => str)
    }
}));

vi.mock('./cls.js', () => ({
    getAndClearEntityChangeIds: vi.fn().mockReturnValue([])
}));

// Mock WebSocket server
const mockWebSocketServer = {
    clients: new Set<WebSocket>(),
    on: vi.fn(),
    close: vi.fn()
};

vi.mock('ws', () => ({
    Server: vi.fn().mockImplementation(() => mockWebSocketServer),
    WebSocket: {
        OPEN: 1,
        CLOSED: 3,
        CONNECTING: 0,
        CLOSING: 2
    }
}));

describe('WebSocket Service', () => {
    let wsService: any;
    let mockWebSocket: Partial<WebSocket>;
    let log: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Create mock WebSocket
        mockWebSocket = {
            readyState: 1, // WebSocket.OPEN
            send: vi.fn(),
            close: vi.fn(),
            on: vi.fn(),
            ping: vi.fn()
        };

        // Clear clients set
        mockWebSocketServer.clients.clear();
        mockWebSocketServer.clients.add(mockWebSocket as WebSocket);

        // Get mocked log
        log = (await import('./log.js')).default;

        // Import service after mocks are set up
        wsService = (await import('./ws.js')).default;
        
        // Initialize the WebSocket server in the service
        // This simulates calling the init function with a mock HTTP server and session parser
        const mockHttpServer = {} as any;
        const mockSessionParser = vi.fn((req, params, cb) => cb());
        wsService.init(mockHttpServer, mockSessionParser);
    });

    afterEach(() => {
        vi.clearAllMocks();
        mockWebSocketServer.clients.clear();
    });

    describe('LLM Stream Message Broadcasting', () => {
        it('should send basic LLM stream message to all clients', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-chat-123',
                content: 'Hello world',
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Sending LLM stream message: chatNoteId=test-chat-123')
            );
        });

        it('should send LLM stream message with thinking state', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-chat-456',
                thinking: 'Processing your request...',
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(log.info).toHaveBeenCalledWith(
                expect.stringMatching(/thinking=true/)
            );
        });

        it('should send LLM stream message with tool execution', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-chat-789',
                toolExecution: {
                    tool: 'calculator',
                    args: { expression: '2+2' },
                    result: '4',
                    toolCallId: 'call_123'
                },
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(log.info).toHaveBeenCalledWith(
                expect.stringMatching(/toolExecution=true/)
            );
        });

        it('should send final LLM stream message with done flag', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-chat-final',
                content: 'Final response',
                done: true
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(log.info).toHaveBeenCalledWith(
                expect.stringMatching(/done=true/)
            );
        });

        it('should handle error in LLM stream message', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-chat-error',
                error: 'AI service not available',
                done: true
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
        });

        it('should log client count for LLM stream messages', () => {
            // Add multiple mock clients
            const mockClient2 = { readyState: 1, send: vi.fn() };
            const mockClient3 = { readyState: 1, send: vi.fn() };
            mockWebSocketServer.clients.add(mockClient2 as WebSocket);
            mockWebSocketServer.clients.add(mockClient3 as WebSocket);

            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-multi-client',
                content: 'Message to all',
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Sent LLM stream message to 3 clients')
            );
        });

        it('should handle closed WebSocket connections gracefully', () => {
            // Set WebSocket to closed state
            mockWebSocket.readyState = 3; // WebSocket.CLOSED

            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-closed-connection',
                content: 'This should not be sent',
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).not.toHaveBeenCalled();
            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Sent LLM stream message to 0 clients')
            );
        });

        it('should handle mixed open and closed connections', () => {
            // Add a closed connection
            const closedSocket = { readyState: 3, send: vi.fn() };
            mockWebSocketServer.clients.add(closedSocket as WebSocket);

            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-mixed-connections',
                content: 'Mixed connection test',
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(closedSocket.send).not.toHaveBeenCalled();
            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Sent LLM stream message to 1 clients')
            );
        });
    });

    describe('LLM Stream Message Content Verification', () => {
        it('should handle empty content in stream message', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-empty-content',
                content: '',
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(log.info).toHaveBeenCalledWith(
                expect.stringMatching(/content=false/)
            );
        });

        it('should handle large content in stream message', () => {
            const largeContent = 'x'.repeat(10000);
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-large-content',
                content: largeContent,
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(log.info).toHaveBeenCalledWith(
                expect.stringMatching(/content=true/)
            );
        });

        it('should handle unicode content in stream message', () => {
            const unicodeContent = '你好 🌍 こんにちは مرحبا';
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-unicode-content',
                content: unicodeContent,
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            const sentData = JSON.parse((mockWebSocket.send as any).mock.calls[0][0]);
            expect(sentData.content).toBe(unicodeContent);
        });

        it('should handle complex tool execution data', () => {
            const complexToolExecution = {
                tool: 'data_analyzer',
                args: {
                    dataset: {
                        rows: 1000,
                        columns: ['name', 'age', 'email'],
                        filters: { active: true }
                    },
                    operations: ['filter', 'group', 'aggregate']
                },
                result: {
                    summary: 'Analysis complete',
                    data: { filtered: 850, grouped: 10 }
                },
                toolCallId: 'call_complex_analysis'
            };

            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-complex-tool',
                toolExecution: complexToolExecution,
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            const sentData = JSON.parse((mockWebSocket.send as any).mock.calls[0][0]);
            expect(sentData.toolExecution).toEqual(complexToolExecution);
        });
    });

    describe('Non-LLM Message Handling', () => {
        it('should send regular messages without special LLM logging', () => {
            const message = {
                type: 'frontend-update' as const,
                data: { test: 'data' }
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            expect(log.info).not.toHaveBeenCalledWith(
                expect.stringContaining('LLM stream message')
            );
        });

        it('should handle sync-failed messages quietly', () => {
            const message = {
                type: 'sync-failed' as const,
                lastSyncedPush: 123
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            // sync-failed messages should not generate regular logs
        });

        it('should handle api-log-messages quietly', () => {
            const message = {
                type: 'api-log-messages' as const,
                logs: ['log1', 'log2']
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
            // api-log-messages should not generate regular logs
        });
    });

    describe('WebSocket Connection Management', () => {
        it('should handle WebSocket send errors gracefully', () => {
            // Mock send to throw an error
            (mockWebSocket.send as any).mockImplementation(() => {
                throw new Error('Connection closed');
            });

            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'test-send-error',
                content: 'This will fail to send',
                done: false
            };

            // Should not throw
            expect(() => wsService.sendMessageToAllClients(message)).not.toThrow();
        });

        it('should handle multiple concurrent stream messages', async () => {
            const promises = Array.from({ length: 10 }, (_, i) => {
                const message = {
                    type: 'llm-stream' as const,
                    chatNoteId: `concurrent-test-${i}`,
                    content: `Message ${i}`,
                    done: false
                };
                return Promise.resolve(wsService.sendMessageToAllClients(message));
            });

            await Promise.all(promises);

            expect(mockWebSocket.send).toHaveBeenCalledTimes(10);
        });

        it('should handle rapid message bursts', () => {
            for (let i = 0; i < 100; i++) {
                const message = {
                    type: 'llm-stream' as const,
                    chatNoteId: 'burst-test',
                    content: `Burst ${i}`,
                    done: i === 99
                };
                wsService.sendMessageToAllClients(message);
            }

            expect(mockWebSocket.send).toHaveBeenCalledTimes(100);
        });
    });

    describe('Message Serialization', () => {
        it('should handle circular reference objects', () => {
            const circularObj: any = { name: 'test' };
            circularObj.self = circularObj;

            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'circular-test',
                toolExecution: {
                    tool: 'test',
                    args: circularObj,
                    result: 'success'
                },
                done: false
            };

            // Should handle serialization error gracefully
            expect(() => wsService.sendMessageToAllClients(message)).not.toThrow();
        });

        it('should handle undefined and null values in messages', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'null-undefined-test',
                content: undefined,
                thinking: null,
                toolExecution: undefined,
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(mockWebSocket.send).toHaveBeenCalled();
            const sentData = JSON.parse((mockWebSocket.send as any).mock.calls[0][0]);
            expect(sentData.thinking).toBeNull();
            expect(sentData.content).toBeUndefined();
        });

        it('should preserve message structure integrity', () => {
            const originalMessage = {
                type: 'llm-stream' as const,
                chatNoteId: 'integrity-test',
                content: 'Test content',
                thinking: 'Test thinking',
                toolExecution: {
                    tool: 'test_tool',
                    args: { param1: 'value1' },
                    result: 'success'
                },
                done: true
            };

            wsService.sendMessageToAllClients(originalMessage);

            const sentData = JSON.parse((mockWebSocket.send as any).mock.calls[0][0]);
            expect(sentData).toEqual(originalMessage);
        });
    });

    describe('Logging Verification', () => {
        it('should log message details correctly', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'log-verification-test',
                content: 'Test content',
                thinking: 'Test thinking',
                toolExecution: { tool: 'test' },
                done: true
            };

            wsService.sendMessageToAllClients(message);

            expect(log.info).toHaveBeenCalledWith(
                expect.stringMatching(
                    /chatNoteId=log-verification-test.*content=true.*thinking=true.*toolExecution=true.*done=true/
                )
            );
        });

        it('should log boolean flags correctly for empty values', () => {
            const message = {
                type: 'llm-stream' as const,
                chatNoteId: 'empty-values-test',
                content: '',
                thinking: undefined,
                toolExecution: null,
                done: false
            };

            wsService.sendMessageToAllClients(message);

            expect(log.info).toHaveBeenCalledWith(
                expect.stringMatching(
                    /content=false.*thinking=false.*toolExecution=false.*done=false/
                )
            );
        });
    });
});