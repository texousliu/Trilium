import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { ChatCompletionOptions, ChatResponse, Message, StreamChunk } from '../ai_interface.js';
import { PROVIDER_CONSTANTS } from '../constants/provider_constants.js';
import type { AnthropicOptions } from './provider_options.js';
import { getAnthropicOptions } from './providers.js';
import log from '../../log.js';
import Anthropic from '@anthropic-ai/sdk';
import { SEARCH_CONSTANTS } from '../constants/search_constants.js';

export class AnthropicService extends BaseAIService {
    private client: any = null;

    constructor() {
        super('Anthropic');
    }

    isAvailable(): boolean {
        return super.isAvailable() && !!options.getOption('anthropicApiKey');
    }

    private getClient(apiKey: string, baseUrl: string, apiVersion?: string, betaVersion?: string): any {
        if (!this.client) {
            this.client = new Anthropic({
                apiKey,
                baseURL: baseUrl,
                defaultHeaders: {
                    'anthropic-version': apiVersion || PROVIDER_CONSTANTS.ANTHROPIC.API_VERSION,
                    'anthropic-beta': betaVersion || PROVIDER_CONSTANTS.ANTHROPIC.BETA_VERSION
                }
            });
        }
        return this.client;
    }

    async generateChatCompletion(messages: Message[], opts: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!this.isAvailable()) {
            throw new Error('Anthropic service is not available. Check API key and AI settings.');
        }

        // Get provider-specific options from the central provider manager
        const providerOptions = getAnthropicOptions(opts);

        // Log provider metadata if available
        if (providerOptions.providerMetadata) {
            log.info(`Using model ${providerOptions.model} from provider ${providerOptions.providerMetadata.provider}`);

            // Log capabilities if available
            const capabilities = providerOptions.providerMetadata.capabilities;
            if (capabilities) {
                log.info(`Model capabilities: ${JSON.stringify(capabilities)}`);
            }
        }

        // Get system prompt
        const systemPrompt = this.getSystemPrompt(providerOptions.systemPrompt || options.getOption('aiSystemPrompt'));

        // Format messages for Anthropic's API
        const anthropicMessages = this.formatMessages(messages);

        try {
            // Initialize the Anthropic client
            const client = this.getClient(
                providerOptions.apiKey,
                providerOptions.baseUrl,
                providerOptions.apiVersion,
                providerOptions.betaVersion
            );

            // Log API key format (without revealing the actual key)
            const apiKeyPrefix = providerOptions.apiKey?.substring(0, 7) || 'undefined';
            const apiKeyLength = providerOptions.apiKey?.length || 0;
            log.info(`[DEBUG] Using Anthropic API key with prefix '${apiKeyPrefix}...' and length ${apiKeyLength}`);

            log.info(`Using Anthropic API with model: ${providerOptions.model}`);

            // Configure request parameters
            const requestParams: any = {
                model: providerOptions.model,
                messages: anthropicMessages,
                system: systemPrompt,
                max_tokens: providerOptions.max_tokens || SEARCH_CONSTANTS.LIMITS.DEFAULT_MAX_TOKENS,
                temperature: providerOptions.temperature,
                top_p: providerOptions.top_p,
                stream: !!providerOptions.stream
            };

            // Add tools support if provided
            if (opts.tools && opts.tools.length > 0) {
                log.info(`Adding ${opts.tools.length} tools to Anthropic request`);

                // Convert OpenAI-style function tools to Anthropic format
                const anthropicTools = this.convertToolsToAnthropicFormat(opts.tools);
                requestParams.tools = anthropicTools;

                // Add tool_choice parameter if specified
                if (opts.tool_choice) {
                    if (opts.tool_choice === 'auto') {
                        requestParams.tool_choice = 'auto';
                    } else if (opts.tool_choice === 'none') {
                        requestParams.tool_choice = 'none';
                    } else if (typeof opts.tool_choice === 'object' && opts.tool_choice.function) {
                        // Map from OpenAI format to Anthropic format
                        requestParams.tool_choice = opts.tool_choice.function.name;
                    } else {
                        requestParams.tool_choice = opts.tool_choice;
                    }
                }
            }

            // Log request summary
            log.info(`Making ${providerOptions.stream ? 'streaming' : 'non-streaming'} request to Anthropic API with model: ${providerOptions.model}`);

            // Handle streaming responses
            if (providerOptions.stream) {
                return this.handleStreamingResponse(client, requestParams, opts, providerOptions);
            } else {
                // Non-streaming request
                const response = await client.messages.create(requestParams);

                // Get the assistant's response text from the content blocks
                const textContent = response.content
                    .filter((block: any) => block.type === 'text')
                    .map((block: any) => block.text)
                    .join('');

                // Process tool calls if any are present in the response
                let toolCalls = null;
                if (response.content) {
                    const toolBlocks = response.content.filter((block: any) =>
                        block.type === 'tool_use' ||
                        (block.type === 'tool_result' && block.tool_use_id)
                    );

                    if (toolBlocks.length > 0) {
                        log.info(`[DEBUG] Found ${toolBlocks.length} tool-related blocks in response`);

                        toolCalls = toolBlocks.map((block: any) => {
                            if (block.type === 'tool_use') {
                                log.info(`[DEBUG] Processing tool_use block: ${JSON.stringify(block, null, 2)}`);

                                // Convert Anthropic tool_use format to standard format expected by our app
                                return {
                                    id: block.id,
                                    type: 'function', // Convert back to function type for internal use
                                    function: {
                                        name: block.name,
                                        arguments: block.input || '{}'
                                    }
                                };
                            }
                            return null;
                        }).filter(Boolean);

                        log.info(`Extracted ${toolCalls.length} tool calls from Anthropic response`);
                    }
                }

                return {
                    text: textContent,
                    model: response.model,
                    provider: this.getName(),
                    tool_calls: toolCalls,
                    usage: {
                        // Anthropic provides token counts in the response
                        promptTokens: response.usage?.input_tokens,
                        completionTokens: response.usage?.output_tokens,
                        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
                    }
                };
            }
        } catch (error) {
            log.error(`Anthropic service error: ${error}`);
            throw error;
        }
    }

    /**
     * Handle streaming response from Anthropic
     *
     * Simplified implementation that leverages the Anthropic SDK's streaming capabilities
     */
    private async handleStreamingResponse(
        client: any,
        params: any,
        opts: ChatCompletionOptions,
        providerOptions: AnthropicOptions
    ): Promise<ChatResponse> {
        // Create a list to collect tool calls during streaming
        const collectedToolCalls: any[] = [];

        // Create a stream handler function that processes the SDK's stream
        const streamHandler = async (callback: (chunk: StreamChunk) => Promise<void> | void): Promise<string> => {
            let completeText = '';
            let currentToolCall: any = null;

            try {
                // Request a streaming response from Anthropic
                log.info(`Starting Anthropic streaming request to: ${providerOptions.baseUrl}/v1/messages`);

                const streamResponse = await client.messages.create({
                    ...params,
                    stream: true
                });

                // Process each chunk in the stream
                for await (const chunk of streamResponse) {
                    if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
                        const text = chunk.delta.text || '';
                        completeText += text;

                        // Send the chunk to the caller
                        await callback({
                            text,
                            done: false,
                            raw: chunk // Include the raw chunk for advanced processing
                        });
                    }
                    // Process tool use events - different format in Anthropic API
                    else if (chunk.type === 'content_block_start' && chunk.content_block?.type === 'tool_use') {
                        // Start collecting a new tool call - convert to our internal format (OpenAI-like)
                        currentToolCall = {
                            id: chunk.content_block.id,
                            type: 'function', // Convert to function type for internal consistency
                            function: {
                                name: chunk.content_block.name,
                                arguments: ''
                            }
                        };

                        // Log the tool use event
                        log.info(`Streaming: Tool use started: ${chunk.content_block.name}`);

                        // Send the tool call event
                        await callback({
                            text: '',
                            done: false,
                            toolExecution: {
                                type: 'start',
                                tool: currentToolCall
                            },
                            raw: chunk
                        });
                    }
                    // Process tool input deltas
                    else if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'tool_use_delta' && currentToolCall) {
                        // Accumulate tool input
                        if (chunk.delta.input) {
                            currentToolCall.function.arguments += chunk.delta.input;

                            // Send the tool input update
                            await callback({
                                text: '',
                                done: false,
                                toolExecution: {
                                    type: 'update',
                                    tool: currentToolCall
                                },
                                raw: chunk
                            });
                        }
                    }
                    // Process tool use completion
                    else if (chunk.type === 'content_block_stop' && currentToolCall) {
                        // Add the completed tool call to our list
                        collectedToolCalls.push({ ...currentToolCall });

                        // Log the tool completion
                        log.info(`Streaming: Tool use completed: ${currentToolCall.function.name}`);

                        // Send the tool completion event
                        await callback({
                            text: '',
                            done: false,
                            toolExecution: {
                                type: 'complete',
                                tool: currentToolCall
                            },
                            tool_calls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
                            raw: chunk
                        });

                        // Reset current tool call
                        currentToolCall = null;
                    }
                }

                // Signal completion with all tool calls
                log.info(`Streaming complete, collected ${collectedToolCalls.length} tool calls`);
                if (collectedToolCalls.length > 0) {
                    log.info(`Tool calls detected in final response: ${JSON.stringify(collectedToolCalls)}`);
                }

                await callback({
                    text: '',
                    done: true,
                    tool_calls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined
                });

                return completeText;
            } catch (error) {
                log.error(`Error in Anthropic streaming: ${error}`);

                // More detailed error logging
                if (error instanceof Error) {
                    log.error(`[DEBUG] Error name: ${error.name}`);
                    log.error(`[DEBUG] Error message: ${error.message}`);
                    log.error(`[DEBUG] Error stack: ${error.stack}`);

                    // If there's response data in the error, log that too
                    const anyError = error as any;
                    if (anyError.response) {
                        log.error(`Error response status: ${anyError.response.status}`);
                        log.error(`Error response data: ${JSON.stringify(anyError.response.data)}`);
                    }
                }

                throw error;
            }
        };

        // Create a custom stream function that captures tool calls
        const captureToolCallsStream = async (callback: (chunk: StreamChunk) => Promise<void> | void): Promise<string> => {
            // Use the original stream handler but wrap it to capture tool calls
            return streamHandler(async (chunk: StreamChunk) => {
                // If the chunk has tool calls, update our collection
                if (chunk.tool_calls && chunk.tool_calls.length > 0) {
                    // Update our collection with new tool calls
                    chunk.tool_calls.forEach(toolCall => {
                        // Only add if it's not already in the collection
                        if (!collectedToolCalls.some(tc => tc.id === toolCall.id)) {
                            collectedToolCalls.push(toolCall);
                        }
                    });
                }

                // Call the original callback
                return callback(chunk);
            });
        };

        // Return a response object with the stream handler and tool_calls property
        const response: ChatResponse = {
            text: '', // Initial text is empty, will be populated during streaming
            model: providerOptions.model,
            provider: this.getName(),
            stream: captureToolCallsStream
        };

        // Define a getter for tool_calls that will return the collected tool calls
        Object.defineProperty(response, 'tool_calls', {
            get: function() {
                return collectedToolCalls.length > 0 ? collectedToolCalls : undefined;
            },
            enumerable: true
        });

        return response;
    }

    /**
     * Format messages for the Anthropic API
     */
    private formatMessages(messages: Message[]): any[] {
        const anthropicMessages: any[] = [];

        // Process each message
        for (const msg of messages) {
            if (msg.role === 'system') {
                // System messages are handled separately in the API call
                continue;
            } else if (msg.role === 'user' || msg.role === 'assistant') {
                // Convert to Anthropic format
                anthropicMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            } else if (msg.role === 'tool') {
                // Tool response messages - typically follow a tool call from the assistant
                anthropicMessages.push({
                    role: 'user',
                    content: msg.content
                });
            }
        }

        return anthropicMessages;
    }

    /**
     * Convert OpenAI-style function tools to Anthropic format
     * OpenAI uses: { type: "function", function: { name, description, parameters } }
     * Anthropic uses: { name, description, input_schema }
     */
    private convertToolsToAnthropicFormat(tools: any[]): any[] {
        if (!tools || tools.length === 0) {
            return [];
        }

        // Filter out invalid tools
        const validTools = tools.filter(tool => {
            if (!tool || typeof tool !== 'object') {
                log.error(`Invalid tool format (not an object)`);
                return false;
            }

            // For function tools, validate required fields
            if (tool.type === 'function') {
                if (!tool.function || !tool.function.name) {
                    log.error(`Function tool missing required fields`);
                    return false;
                }
            }

            return true;
        });

        if (validTools.length < tools.length) {
            log.info(`Filtered out ${tools.length - validTools.length} invalid tools`);
        }

        // Convert tools to Anthropic format
        return validTools.map((tool: any) => {
            // Convert from OpenAI format to Anthropic format
            if (tool.type === 'function' && tool.function) {
                return {
                    name: tool.function.name,
                    description: tool.function.description || '',
                    input_schema: tool.function.parameters || {}
                };
            }

            // Handle already converted Anthropic format (from our temporary fix)
            if (tool.type === 'custom' && tool.custom) {
                return {
                    name: tool.custom.name,
                    description: tool.custom.description || '',
                    input_schema: tool.custom.parameters || {}
                };
            }

            // If the tool is already in the correct Anthropic format
            if (tool.name && (tool.input_schema || tool.parameters)) {
                return {
                    name: tool.name,
                    description: tool.description || '',
                    input_schema: tool.input_schema || tool.parameters
                };
            }

            log.error(`Unhandled tool format encountered`);
            return null;
        }).filter(Boolean); // Filter out any null values
    }
}
