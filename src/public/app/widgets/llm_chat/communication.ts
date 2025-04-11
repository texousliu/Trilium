/**
 * Communication functions for LLM Chat
 */
import server from "../../services/server.js";
import type { SessionResponse } from "./types.js";

/**
 * Create a new chat session
 */
export async function createChatSession(): Promise<string | null> {
    try {
        const resp = await server.post<SessionResponse>('llm/sessions', {
            title: 'Note Chat'
        });

        if (resp && resp.id) {
            return resp.id;
        }
    } catch (error) {
        console.error('Failed to create chat session:', error);
    }

    return null;
}

/**
 * Check if a session exists
 */
export async function checkSessionExists(sessionId: string): Promise<boolean> {
    try {
        const sessionCheck = await server.get<any>(`llm/sessions/${sessionId}`);
        return !!(sessionCheck && sessionCheck.id);
    } catch (error) {
        console.log(`Error checking session ${sessionId}:`, error);
        return false;
    }
}

/**
 * Set up streaming response via WebSocket
 */
export async function setupStreamingResponse(
    sessionId: string,
    messageParams: any,
    onContentUpdate: (content: string) => void,
    onThinkingUpdate: (thinking: string) => void,
    onToolExecution: (toolData: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        let assistantResponse = '';
        let receivedAnyContent = false;
        let timeoutId: number | null = null;
        let initialTimeoutId: number | null = null;
        let receivedAnyMessage = false;
        let eventListener: ((event: Event) => void) | null = null;

        // Create a unique identifier for this response process
        const responseId = `llm-stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        console.log(`[${responseId}] Setting up WebSocket streaming for session ${sessionId}`);

        // Create a message handler for CustomEvents
        eventListener = (event: Event) => {
            const customEvent = event as CustomEvent;
            const message = customEvent.detail;

            // Only process messages for our session
            if (!message || message.sessionId !== sessionId) {
                return;
            }

            console.log(`[${responseId}] LLM Stream message received via CustomEvent: session=${sessionId}, content=${!!message.content}, contentLength=${message.content?.length || 0}, thinking=${!!message.thinking}, toolExecution=${!!message.toolExecution}, done=${!!message.done}`);

            // Mark first message received
            if (!receivedAnyMessage) {
                receivedAnyMessage = true;
                console.log(`[${responseId}] First message received for session ${sessionId}`);

                // Clear the initial timeout since we've received a message
                if (initialTimeoutId !== null) {
                    window.clearTimeout(initialTimeoutId);
                    initialTimeoutId = null;
                }
            }

            // Handle content updates
            if (message.content) {
                receivedAnyContent = true;
                assistantResponse += message.content;

                // Update the UI immediately
                onContentUpdate(assistantResponse);

                // Reset timeout since we got content
                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                }

                // Set new timeout
                timeoutId = window.setTimeout(() => {
                    console.warn(`[${responseId}] Stream timeout for session ${sessionId}`);

                    // Clean up
                    cleanupEventListener(eventListener);
                    reject(new Error('Stream timeout'));
                }, 30000);
            }

            // Handle tool execution updates
            if (message.toolExecution) {
                console.log(`[${responseId}] Received tool execution update: action=${message.toolExecution.action || 'unknown'}`);
                onToolExecution(message.toolExecution);
            }

            // Handle thinking state updates
            if (message.thinking) {
                console.log(`[${responseId}] Received thinking update: ${message.thinking.substring(0, 50)}...`);
                onThinkingUpdate(message.thinking);
            }

            // Handle completion
            if (message.done) {
                console.log(`[${responseId}] Stream completed for session ${sessionId}, has content: ${!!message.content}, content length: ${message.content?.length || 0}, current response: ${assistantResponse.length} chars`);

                // Dump message content to console for debugging
                if (message.content) {
                    console.log(`[${responseId}] CONTENT IN DONE MESSAGE (first 200 chars): "${message.content.substring(0, 200)}..."`);
                }

                // Clear timeout if set
                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                    timeoutId = null;
                }

                // Check if we have content in the done message
                if (message.content) {
                    console.log(`[${responseId}] Processing content in done message: ${message.content.length} chars`);
                    receivedAnyContent = true;

                    // Replace current response if we didn't have content before or if it's empty
                    if (assistantResponse.length === 0) {
                        console.log(`[${responseId}] Using content from done message as full response`);
                        assistantResponse = message.content;
                    }
                    // Otherwise append it if it's different
                    else if (message.content !== assistantResponse) {
                        console.log(`[${responseId}] Appending content from done message to existing response`);
                        assistantResponse += message.content;
                    }
                    else {
                        console.log(`[${responseId}] Content in done message is identical to existing response, not appending`);
                    }

                    onContentUpdate(assistantResponse);
                }

                // Clean up and resolve
                cleanupEventListener(eventListener);
                onComplete();
                resolve();
            }
        };

        // Register event listener for the custom event
        try {
            window.addEventListener('llm-stream-message', eventListener);
            console.log(`[${responseId}] Event listener added for llm-stream-message events`);
        } catch (err) {
            console.error(`[${responseId}] Error setting up event listener:`, err);
            reject(err);
            return;
        }

        // Set initial timeout for receiving any message
        initialTimeoutId = window.setTimeout(() => {
            console.warn(`[${responseId}] No messages received for initial period in session ${sessionId}`);
            if (!receivedAnyMessage) {
                console.error(`[${responseId}] WebSocket connection not established for session ${sessionId}`);

                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                }

                // Clean up
                cleanupEventListener(eventListener);

                // Show error message to user
                reject(new Error('WebSocket connection not established'));
            }
        }, 10000);

        // Send the streaming request to start the process
        console.log(`[${responseId}] Sending HTTP POST request to initiate streaming: /llm/sessions/${sessionId}/messages/stream`);
        server.post(`llm/sessions/${sessionId}/messages/stream`, {
            ...messageParams,
            stream: true // Explicitly indicate this is a streaming request
        }).catch(err => {
            console.error(`[${responseId}] HTTP error sending streaming request for session ${sessionId}:`, err);

            // Clean up timeouts
            if (initialTimeoutId !== null) {
                window.clearTimeout(initialTimeoutId);
                initialTimeoutId = null;
            }

            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
                timeoutId = null;
            }

            // Clean up event listener
            cleanupEventListener(eventListener);

            reject(err);
        });
    });
}

/**
 * Clean up an event listener
 */
function cleanupEventListener(listener: ((event: Event) => void) | null): void {
    if (listener) {
        try {
            window.removeEventListener('llm-stream-message', listener);
            console.log(`Successfully removed event listener`);
        } catch (err) {
            console.error(`Error removing event listener:`, err);
        }
    }
}

/**
 * Get a direct response from the server
 */
export async function getDirectResponse(sessionId: string, messageParams: any): Promise<any> {
    // Create a copy of the params without any streaming flags
    const postParams = {
        ...messageParams,
        stream: false  // Explicitly set to false to ensure we get a direct response
    };

    console.log(`Sending direct POST request for session ${sessionId}`);

    // Send the message via POST request with the updated params
    return server.post<any>(`llm/sessions/${sessionId}/messages`, postParams);
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats(): Promise<any> {
    return server.get('llm/embeddings/stats');
}
