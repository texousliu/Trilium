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

        // Enhanced logging for content chunks and completion status
        if (chunkCount === 1 || chunkCount % 10 === 0 || chunk.done) {
            log.info(`Processing ${options.providerName} stream chunk #${chunkCount}, done=${!!chunk.done}, has content=${!!chunk.message?.content}, content length=${chunk.message?.content?.length || 0}`);
            logged = true;
        }

        // Extract content if available
        if (chunk.message?.content) {
            textToAdd = chunk.message.content;
            const newCompleteText = completeText + textToAdd;

            if (chunkCount === 1) {
                // Log the first chunk more verbosely for debugging
                log.info(`First content chunk [${chunk.message.content.length} chars]: "${textToAdd.substring(0, 100)}${textToAdd.length > 100 ? '...' : ''}"`);
            }
            
            // For final chunks with done=true, log more information
            if (chunk.done) {
                log.info(`Final content chunk received with done=true flag. Length: ${chunk.message.content.length}`);
            }

            return { completeText: newCompleteText, logged };
        } else if (chunk.done) {
            // If it's the final chunk with no content, log this case
            log.info(`Empty final chunk received with done=true flag`);
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
            // Log all done=true callbacks and first chunk for debugging
            if (done || chunkNumber === 1) {
                log.info(`Sending chunk to callback: chunkNumber=${chunkNumber}, contentLength=${content?.length || 0}, done=${done}`);
            }
            
            // Always make sure we have a string for content
            const safeContent = content || '';
            
            const result = callback(safeContent, done, chunk);
            // Handle both Promise and void return types
            if (result instanceof Promise) {
                await result;
            }

            if (chunkNumber === 1) {
                log.info(`Successfully called streamCallback with first chunk`);
            }
            
            if (done) {
                log.info(`Successfully called streamCallback with done=true flag`);
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
            log.info(`Sending explicit final done=true callback after processing all chunks. Complete text length: ${completeText?.length || 0}`);
            
            // Pass the complete text instead of empty string for better UX
            // The client will know it's done based on the done=true flag
            const result = callback(completeText || '', true, { done: true, complete: true });
            
            // Handle both Promise and void return types
            if (result instanceof Promise) {
                await result;
            }
            
            log.info(`Final callback sent successfully with done=true flag`);
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
    processFn: (
        callback: (chunk: StreamChunk) => Promise<void> | void
    ) => Promise<string>
): (callback: (chunk: StreamChunk) => Promise<void> | void) => Promise<string> {
    return async (callback) => {
        let chunkCount = 0;

        try {
            // Run the processor function with our callback
            return await processFn(async (chunk) => {
                chunkCount++;

                // Pass each chunk directly to the callback as it arrives
                // without modifying or accumulating its content
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
