/**
 * Stream Handler - Reusable streaming implementation for LLM providers
 *
 * This module provides common streaming utilities that can be used by any LLM provider.
 * It abstracts the complexities of handling streaming responses and tool executions.
 */

import type { StreamChunk as BaseStreamChunk, ChatCompletionOptions } from '../ai_interface.js';
import log from '../../log.js';

/**
 * Extended StreamChunk interface that makes 'done' optional for internal use
 */
export interface StreamChunk extends Omit<BaseStreamChunk, 'done'> {
    done?: boolean;
}

/**
 * Stream processing options
 */
export interface StreamProcessingOptions {
    streamCallback?: (text: string, done: boolean, chunk?: any) => Promise<void> | void;
    providerName: string;
    modelName: string;
}

/**
 * Stream processor that handles common streaming operations
 */
export class StreamProcessor {
    /**
     * Process an individual chunk from a streaming response
     */
    static async processChunk(
        chunk: any,
        completeText: string,
        chunkCount: number,
        options: StreamProcessingOptions
    ): Promise<{completeText: string, logged: boolean}> {
        let textToAdd = '';
        let logged = false;

        // Log first chunk and periodic updates
        if (chunkCount === 1 || chunkCount % 10 === 0) {
            log.info(`Processing ${options.providerName} stream chunk #${chunkCount}, done=${!!chunk.done}, has content=${!!chunk.message?.content}`);
            logged = true;
        }

        // Extract content if available
        if (chunk.message?.content) {
            textToAdd = chunk.message.content;
            const newCompleteText = completeText + textToAdd;

            if (chunkCount === 1) {
                log.info(`First content chunk: "${textToAdd.substring(0, 50)}${textToAdd.length > 50 ? '...' : ''}"`);
            }

            return { completeText: newCompleteText, logged };
        }

        return { completeText, logged };
    }

    /**
     * Send a streaming chunk to the callback
     */
    static async sendChunkToCallback(
        callback: (text: string, done: boolean, chunk?: any) => Promise<void> | void,
        content: string,
        done: boolean,
        chunk: any,
        chunkNumber: number
    ): Promise<void> {
        try {
            const result = callback(content || '', done, chunk);
            // Handle both Promise and void return types
            if (result instanceof Promise) {
                await result;
            }

            if (chunkNumber === 1) {
                log.info(`Successfully called streamCallback with first chunk`);
            }
        } catch (callbackError) {
            log.error(`Error in streamCallback: ${callbackError}`);
        }
    }

    /**
     * Send final completion callback
     */
    static async sendFinalCallback(
        callback: (text: string, done: boolean, chunk?: any) => Promise<void> | void,
        completeText: string
    ): Promise<void> {
        try {
            log.info(`Sending final done=true callback after processing all chunks`);
            const result = callback('', true, { done: true });
            // Handle both Promise and void return types
            if (result instanceof Promise) {
                await result;
            }
        } catch (finalCallbackError) {
            log.error(`Error in final streamCallback: ${finalCallbackError}`);
        }
    }

    /**
     * Detect and extract tool calls from a response chunk
     */
    static extractToolCalls(chunk: any): any[] {
        if (chunk.message?.tool_calls &&
            Array.isArray(chunk.message.tool_calls) &&
            chunk.message.tool_calls.length > 0) {

            log.info(`Detected ${chunk.message.tool_calls.length} tool calls in stream chunk`);
            return [...chunk.message.tool_calls];
        }

        return [];
    }

    /**
     * Create a standard response object from streaming results
     */
    static createFinalResponse(
        completeText: string,
        modelName: string,
        providerName: string,
        toolCalls: any[],
        usage: any = {}
    ) {
        return {
            text: completeText,
            model: modelName,
            provider: providerName,
            tool_calls: toolCalls,
            usage
        };
    }
}

/**
 * Create a streaming handler that follows a consistent pattern
 */
export function createStreamHandler(
    options: StreamProcessingOptions,
    streamImplementation: (callback: (chunk: StreamChunk) => Promise<void>) => Promise<string>
) {
    // Return a standard stream handler function that providers can use
    return async (callback: (chunk: BaseStreamChunk) => Promise<void>): Promise<string> => {
        let completeText = '';
        let chunkCount = 0;

        try {
            // Call the provided implementation
            return await streamImplementation(async (chunk: StreamChunk) => {
                chunkCount++;

                // Process the chunk
                if (chunk.text) {
                    completeText += chunk.text;
                }

                // Forward to callback - ensure done is always boolean for BaseStreamChunk
                await callback({
                    text: chunk.text || '',
                    done: !!chunk.done, // Ensure done is boolean
                    raw: chunk.raw || chunk // Include raw data
                });
            });
        } catch (error) {
            log.error(`Error in stream handler: ${error}`);
            throw error;
        } finally {
            // Always ensure a final done=true chunk is sent
            if (chunkCount > 0) {
                try {
                    await callback({
                        text: '',
                        done: true
                    });
                } catch (e) {
                    log.error(`Error sending final chunk: ${e}`);
                }
            }
        }
    };
}
