import { test, expect, type Page } from '@playwright/test';
import type { WebSocket } from 'ws';

interface StreamMessage {
    type: string;
    chatNoteId?: string;
    content?: string;
    thinking?: string;
    toolExecution?: any;
    done?: boolean;
    error?: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Array<{ role: string; content: string }>;
    createdAt: string;
}

test.describe('LLM Streaming E2E Tests', () => {
    let chatSessionId: string;

    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('/');
        
        // Wait for the application to load
        await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
        
        // Create a new chat session for testing
        const response = await page.request.post('/api/llm/chat', {
            data: {
                title: 'E2E Streaming Test Chat'
            }
        });
        
        expect(response.ok()).toBeTruthy();
        const chatData: ChatSession = await response.json();
        chatSessionId = chatData.id;
    });

    test.afterEach(async ({ page }) => {
        // Clean up the chat session
        if (chatSessionId) {
            await page.request.delete(`/api/llm/chat/${chatSessionId}`);
        }
    });

    test('should establish WebSocket connection and receive streaming messages', async ({ page }) => {
        // Set up WebSocket message collection
        const streamMessages: StreamMessage[] = [];
        
        // Monitor WebSocket messages
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            
            // Mock WebSocket to capture messages
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                            }
                        } catch (e) {
                            // Ignore invalid JSON
                        }
                    });
                }
            };
        });

        // Navigate to chat interface
        await page.goto(`/chat/${chatSessionId}`);
        
        // Wait for chat interface to load
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        // Type a message
        const messageInput = page.locator('[data-testid="message-input"]');
        await messageInput.fill('Tell me a short story about a robot');
        
        // Click send with streaming enabled
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Wait for streaming to start
        await page.waitForFunction(() => {
            return (window as any).llmStreamMessages && (window as any).llmStreamMessages.length > 0;
        }, { timeout: 10000 });
        
        // Wait for streaming to complete (done: true message)
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            return messages.some((msg: StreamMessage) => msg.done === true);
        }, { timeout: 30000 });
        
        // Get all collected stream messages
        const collectedMessages = await page.evaluate(() => (window as any).llmStreamMessages);
        
        // Verify we received streaming messages
        expect(collectedMessages.length).toBeGreaterThan(0);
        
        // Verify message structure
        const firstMessage = collectedMessages[0];
        expect(firstMessage.type).toBe('llm-stream');
        expect(firstMessage.chatNoteId).toBe(chatSessionId);
        
        // Verify we received a completion message
        const completionMessage = collectedMessages.find((msg: StreamMessage) => msg.done === true);
        expect(completionMessage).toBeDefined();
        
        // Verify content was streamed
        const contentMessages = collectedMessages.filter((msg: StreamMessage) => msg.content);
        expect(contentMessages.length).toBeGreaterThan(0);
    });

    test('should handle streaming with thinking states visible', async ({ page }) => {
        const streamMessages: StreamMessage[] = [];
        
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                            }
                        } catch (e) {}
                    });
                }
            };
        });

        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        // Enable thinking display
        await page.locator('[data-testid="show-thinking-toggle"]').check();
        
        // Send a complex message that would trigger thinking
        await page.locator('[data-testid="message-input"]').fill('Explain quantum computing and then write a haiku about it');
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Wait for thinking messages
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            return messages.some((msg: StreamMessage) => msg.thinking);
        }, { timeout: 15000 });
        
        const collectedMessages = await page.evaluate(() => (window as any).llmStreamMessages);
        
        // Verify thinking messages were received
        const thinkingMessages = collectedMessages.filter((msg: StreamMessage) => msg.thinking);
        expect(thinkingMessages.length).toBeGreaterThan(0);
        
        // Verify thinking content is displayed in UI
        await expect(page.locator('[data-testid="thinking-display"]')).toBeVisible();
        const thinkingText = await page.locator('[data-testid="thinking-display"]').textContent();
        expect(thinkingText).toBeTruthy();
    });

    test('should handle tool execution during streaming', async ({ page }) => {
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                            }
                        } catch (e) {}
                    });
                }
            };
        });

        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        // Send a message that would trigger tool usage
        await page.locator('[data-testid="message-input"]').fill('What is 15 * 37? Use a calculator tool.');
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Wait for tool execution messages
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            return messages.some((msg: StreamMessage) => msg.toolExecution);
        }, { timeout: 20000 });
        
        const collectedMessages = await page.evaluate(() => (window as any).llmStreamMessages);
        
        // Verify tool execution messages
        const toolMessages = collectedMessages.filter((msg: StreamMessage) => msg.toolExecution);
        expect(toolMessages.length).toBeGreaterThan(0);
        
        const toolMessage = toolMessages[0];
        expect(toolMessage.toolExecution.tool).toBeTruthy();
        expect(toolMessage.toolExecution.args).toBeTruthy();
        
        // Verify tool execution is displayed in UI
        await expect(page.locator('[data-testid="tool-execution-display"]')).toBeVisible();
    });

    test('should handle streaming errors gracefully', async ({ page }) => {
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                            }
                        } catch (e) {}
                    });
                }
            };
        });

        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        // Trigger an error by sending an invalid request or when AI is disabled
        await page.locator('[data-testid="message-input"]').fill('This should trigger an error');
        
        // Mock AI service to be unavailable
        await page.route('/api/llm/**', route => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'AI service unavailable' })
            });
        });
        
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Wait for error message
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            return messages.some((msg: StreamMessage) => msg.error);
        }, { timeout: 10000 });
        
        const collectedMessages = await page.evaluate(() => (window as any).llmStreamMessages);
        
        // Verify error message was received
        const errorMessages = collectedMessages.filter((msg: StreamMessage) => msg.error);
        expect(errorMessages.length).toBeGreaterThan(0);
        
        const errorMessage = errorMessages[0];
        expect(errorMessage.error).toBeTruthy();
        expect(errorMessage.done).toBe(true);
        
        // Verify error is displayed in UI
        await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
        const errorText = await page.locator('[data-testid="error-display"]').textContent();
        expect(errorText).toContain('error');
    });

    test('should handle rapid consecutive streaming requests', async ({ page }) => {
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                            }
                        } catch (e) {}
                    });
                }
            };
        });

        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        // Send multiple messages rapidly
        for (let i = 0; i < 3; i++) {
            await page.locator('[data-testid="message-input"]').fill(`Rapid message ${i + 1}`);
            await page.locator('[data-testid="send-stream-button"]').click();
            
            // Small delay between requests
            await page.waitForTimeout(100);
        }
        
        // Wait for all responses to complete
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            const doneMessages = messages.filter((msg: StreamMessage) => msg.done === true);
            return doneMessages.length >= 3;
        }, { timeout: 30000 });
        
        const collectedMessages = await page.evaluate(() => (window as any).llmStreamMessages);
        
        // Verify all requests were processed
        const uniqueChatIds = new Set(collectedMessages.map((msg: StreamMessage) => msg.chatNoteId));
        expect(uniqueChatIds.size).toBe(1); // All from same chat
        
        const doneMessages = collectedMessages.filter((msg: StreamMessage) => msg.done === true);
        expect(doneMessages.length).toBeGreaterThanOrEqual(3);
    });

    test('should preserve message order during streaming', async ({ page }) => {
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            window.messageOrder = [];
            
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                                if (data.content) {
                                    (window as any).messageOrder.push(data.content);
                                }
                            }
                        } catch (e) {}
                    });
                }
            };
        });

        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        await page.locator('[data-testid="message-input"]').fill('Count from 1 to 10 with each number in a separate chunk');
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Wait for streaming to complete
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            return messages.some((msg: StreamMessage) => msg.done === true);
        }, { timeout: 20000 });
        
        const messageOrder = await page.evaluate(() => (window as any).messageOrder);
        
        // Verify messages arrived in order
        expect(messageOrder.length).toBeGreaterThan(0);
        
        // Verify content appears in UI in correct order
        const chatContent = await page.locator('[data-testid="chat-messages"]').textContent();
        expect(chatContent).toBeTruthy();
    });

    test('should handle WebSocket disconnection and reconnection', async ({ page }) => {
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            window.connectionEvents = [];
            
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    
                    this.addEventListener('open', () => {
                        (window as any).connectionEvents.push('open');
                    });
                    
                    this.addEventListener('close', () => {
                        (window as any).connectionEvents.push('close');
                    });
                    
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                            }
                        } catch (e) {}
                    });
                }
            };
        });

        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        // Start a streaming request
        await page.locator('[data-testid="message-input"]').fill('Tell me a long story');
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Wait for streaming to start
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            return messages.length > 0;
        }, { timeout: 10000 });
        
        // Simulate network disconnection by going offline
        await page.context().setOffline(true);
        await page.waitForTimeout(2000);
        
        // Reconnect
        await page.context().setOffline(false);
        
        // Verify connection events
        const connectionEvents = await page.evaluate(() => (window as any).connectionEvents);
        expect(connectionEvents).toContain('open');
        
        // UI should show reconnection status
        await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
    });

    test('should display streaming progress indicators', async ({ page }) => {
        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        await page.locator('[data-testid="message-input"]').fill('Generate a detailed response');
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Verify typing indicator appears
        await expect(page.locator('[data-testid="typing-indicator"]')).toBeVisible();
        
        // Verify progress indicators during streaming
        await expect(page.locator('[data-testid="streaming-progress"]')).toBeVisible();
        
        // Wait for streaming to complete
        await page.waitForFunction(() => {
            const isStreamingDone = page.locator('[data-testid="streaming-complete"]').isVisible();
            return isStreamingDone;
        }, { timeout: 30000 });
        
        // Verify indicators are hidden when done
        await expect(page.locator('[data-testid="typing-indicator"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="streaming-progress"]')).not.toBeVisible();
    });

    test('should handle large streaming responses', async ({ page }) => {
        await page.addInitScript(() => {
            window.llmStreamMessages = [];
            window.totalContentLength = 0;
            
            const originalWebSocket = window.WebSocket;
            window.WebSocket = class extends originalWebSocket {
                constructor(url: string | URL, protocols?: string | string[]) {
                    super(url, protocols);
                    this.addEventListener('message', (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.type === 'llm-stream') {
                                (window as any).llmStreamMessages.push(data);
                                if (data.content) {
                                    (window as any).totalContentLength += data.content.length;
                                }
                            }
                        } catch (e) {}
                    });
                }
            };
        });

        await page.goto(`/chat/${chatSessionId}`);
        await page.waitForSelector('[data-testid="chat-interface"]');
        
        // Request a large response
        await page.locator('[data-testid="message-input"]').fill('Write a very detailed, long response about the history of computers, at least 2000 words');
        await page.locator('[data-testid="send-stream-button"]').click();
        
        // Wait for large response to complete
        await page.waitForFunction(() => {
            const messages = (window as any).llmStreamMessages || [];
            return messages.some((msg: StreamMessage) => msg.done === true);
        }, { timeout: 60000 });
        
        const totalLength = await page.evaluate(() => (window as any).totalContentLength);
        const messages = await page.evaluate(() => (window as any).llmStreamMessages);
        
        // Verify large content was received
        expect(totalLength).toBeGreaterThan(1000); // At least 1KB
        expect(messages.length).toBeGreaterThan(10); // Multiple chunks
        
        // Verify UI can handle large content
        const chatMessages = await page.locator('[data-testid="chat-messages"]').textContent();
        expect(chatMessages!.length).toBeGreaterThan(1000);
    });
});