import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { Message, ChatCompletionOptions, ChatResponse, StreamChunk } from '../ai_interface.js';
import { OllamaMessageFormatter } from '../formatters/ollama_formatter.js';
import log from '../../log.js';
import type { ToolCall } from '../tools/tool_interfaces.js';
import toolRegistry from '../tools/tool_registry.js';
import type { OllamaOptions } from './provider_options.js';
import { getOllamaOptions } from './providers.js';
import { Ollama, type ChatRequest, type ChatResponse as OllamaChatResponse } from 'ollama';

// Add an interface for tool execution feedback status
interface ToolExecutionStatus {
    toolCallId: string;
    name: string;
    success: boolean;
    result: string;
    error?: string;
}

export class OllamaService extends BaseAIService {
    private formatter: OllamaMessageFormatter;
    private client: Ollama | null = null;

    constructor() {
        super('Ollama');
        this.formatter = new OllamaMessageFormatter();
    }

    isAvailable(): boolean {
        return super.isAvailable() && !!options.getOption('ollamaBaseUrl');
    }

    private getClient(): Ollama {
        if (!this.client) {
            const baseUrl = options.getOption('ollamaBaseUrl');
            if (!baseUrl) {
                throw new Error('Ollama base URL is not configured');
            }

            log.info(`Creating new Ollama client with base URL: ${baseUrl}`);

            // Create client with debug options
            try {
                this.client = new Ollama({
                    host: baseUrl,
                    fetch: (url, init) => {
                        log.info(`Ollama API request to: ${url}`);
                        log.info(`Ollama API request method: ${init?.method || 'GET'}`);
                        log.info(`Ollama API request headers: ${JSON.stringify(init?.headers || {})}`);

                        // Call the actual fetch
                        return fetch(url, init).then(response => {
                            log.info(`Ollama API response status: ${response.status}`);
                            if (!response.ok) {
                                log.error(`Ollama API error response: ${response.statusText}`);
                            }
                            return response;
                        }).catch(error => {
                            log.error(`Ollama API fetch error: ${error.message}`);
                            throw error;
                        });
                    }
                });

                log.info(`Ollama client successfully created`);
            } catch (error) {
                log.error(`Error creating Ollama client: ${error}`);
                throw error;
            }
        }
        return this.client;
    }

    async generateChatCompletion(messages: Message[], opts: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!this.isAvailable()) {
            throw new Error('Ollama service is not available. Check API URL in settings.');
        }

        // Get provider-specific options from the central provider manager
        const providerOptions = await getOllamaOptions(opts);

        // Log provider metadata if available
        if (providerOptions.providerMetadata) {
            log.info(`Using model ${providerOptions.model} from provider ${providerOptions.providerMetadata.provider}`);

            // Log capabilities if available
            const capabilities = providerOptions.providerMetadata.capabilities;
            if (capabilities) {
                log.info(`Model capabilities: ${JSON.stringify(capabilities)}`);
            }
        }

        const systemPrompt = this.getSystemPrompt(providerOptions.systemPrompt || options.getOption('aiSystemPrompt'));

        try {
            // Check if we should add tool execution feedback
            if (providerOptions.toolExecutionStatus && Array.isArray(providerOptions.toolExecutionStatus) && providerOptions.toolExecutionStatus.length > 0) {
                log.info(`Adding tool execution feedback to messages`);
                messages = this.addToolExecutionFeedback(messages, providerOptions.toolExecutionStatus);
            }

            // Determine whether to use the formatter or send messages directly
            let messagesToSend: Message[];

            if (providerOptions.bypassFormatter) {
                // Bypass the formatter entirely - use messages as is
                messagesToSend = [...messages];
                log.info(`Bypassing formatter for Ollama request with ${messages.length} messages`);
            } else {
                // Use the formatter to prepare messages
                messagesToSend = this.formatter.formatMessages(
                    messages,
                    systemPrompt,
                    undefined, // context
                    providerOptions.preserveSystemPrompt
                );
                log.info(`Sending to Ollama with formatted messages: ${messagesToSend.length}`);
            }

            // Get tools if enabled
            let tools = [];
            if (providerOptions.enableTools !== false) {
                try {
                    tools = providerOptions.tools && providerOptions.tools.length > 0
                        ? providerOptions.tools
                        : toolRegistry.getAllToolDefinitions();

                    // Handle empty tools array
                    if (tools.length === 0) {
                        log.info('No tools found, attempting to initialize tools...');
                        const toolInitializer = await import('../tools/tool_initializer.js');
                        await toolInitializer.default.initializeTools();
                        tools = toolRegistry.getAllToolDefinitions();
                        log.info(`After initialization: ${tools.length} tools available`);
                    }

                    if (tools.length > 0) {
                        log.info(`Sending ${tools.length} tool definitions to Ollama`);
                    }
                } catch (error: any) {
                    log.error(`Error preparing tools: ${error.message || String(error)}`);
                    tools = []; // Empty fallback
                }
            }

            // Convert our message format to Ollama's format
            const convertedMessages = messagesToSend.map(msg => {
                const converted: any = {
                    role: msg.role,
                    content: msg.content
                };

                if (msg.tool_calls) {
                    converted.tool_calls = msg.tool_calls.map(tc => {
                        // For Ollama, arguments must be an object, not a string
                        let processedArgs = tc.function.arguments;

                        // If arguments is a string, try to parse it as JSON
                        if (typeof processedArgs === 'string') {
                            try {
                                processedArgs = JSON.parse(processedArgs);
                            } catch (e) {
                                // If parsing fails, create an object with a single property
                                log.info(`Could not parse tool arguments as JSON: ${e}`);
                                processedArgs = { raw: processedArgs };
                            }
                        }

                        return {
                            id: tc.id,
                            function: {
                                name: tc.function.name,
                                arguments: processedArgs
                            }
                        };
                    });
                }

                if (msg.tool_call_id) {
                    converted.tool_call_id = msg.tool_call_id;
                }

                if (msg.name) {
                    converted.name = msg.name;
                }

                return converted;
            });

            // Prepare base request options
            const baseRequestOptions = {
                model: providerOptions.model,
                messages: convertedMessages,
                options: providerOptions.options,
                // Add tools if available
                tools: tools.length > 0 ? tools : undefined
            };

            // Get client instance
            const client = this.getClient();

            // Handle streaming
            if (opts.stream || opts.streamCallback) {
                return this.handleStreamingResponse(client, baseRequestOptions, opts, providerOptions);
            } else {
                // Non-streaming request
                log.info(`Using non-streaming mode with Ollama client`);

                // Create non-streaming request
                const nonStreamingRequest = {
                    ...baseRequestOptions,
                    stream: false as const // Use const assertion for type safety
                };

                const response = await client.chat(nonStreamingRequest);

                // Log response details
                log.info(`========== OLLAMA API RESPONSE ==========`);
                log.info(`Model: ${response.model}, Content length: ${response.message?.content?.length || 0} chars`);
                log.info(`Tokens: ${response.prompt_eval_count || 0} prompt, ${response.eval_count || 0} completion, ${(response.prompt_eval_count || 0) + (response.eval_count || 0)} total`);

                // Handle the response and extract tool calls if present
                const chatResponse: ChatResponse = {
                    text: response.message?.content || '',
                    model: response.model || providerOptions.model,
                    provider: this.getName(),
                    usage: {
                        promptTokens: response.prompt_eval_count || 0,
                        completionTokens: response.eval_count || 0,
                        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
                    }
                };

                // Add tool calls if present
                if (response.message?.tool_calls && response.message.tool_calls.length > 0) {
                    log.info(`Ollama response includes ${response.message.tool_calls.length} tool calls`);
                    chatResponse.tool_calls = this.transformToolCalls(response.message.tool_calls);
                }

                return chatResponse;
            }
        } catch (error: any) {
            // Enhanced error handling with detailed diagnostics
            log.error(`Ollama service error: ${error.message || String(error)}`);
            if (error.stack) {
                log.error(`Error stack trace: ${error.stack}`);
            }

            // Propagate the original error
            throw error;
        }
    }

    /**
     * Handle streaming response from Ollama
     *
     * Simplified implementation that leverages the Ollama SDK's streaming capabilities
     */
    private async handleStreamingResponse(
        client: Ollama,
        requestOptions: any,
        opts: ChatCompletionOptions,
        providerOptions: OllamaOptions
    ): Promise<ChatResponse> {
        log.info(`Using streaming mode with Ollama client`);

        // Log detailed information about the streaming setup
        log.info(`Ollama streaming details: model=${providerOptions.model}, streamCallback=${opts.streamCallback ? 'provided' : 'not provided'}`);

        // Create a stream handler function that processes the SDK's stream
        const streamHandler = async (callback: (chunk: StreamChunk) => Promise<void> | void): Promise<string> => {
            let completeText = '';
            let responseToolCalls: any[] = [];
            let chunkCount = 0;

            try {
                // Create streaming request
                const streamingRequest = {
                    ...requestOptions,
                    stream: true as const // Use const assertion to fix the type
                };

                log.info(`Creating Ollama streaming request with options: model=${streamingRequest.model}, stream=${streamingRequest.stream}, tools=${streamingRequest.tools ? streamingRequest.tools.length : 0}`);

                // Get the async iterator
                log.info(`Calling Ollama chat API with streaming enabled`);
                let streamIterator;
                try {
                    log.info(`About to call client.chat with streaming request to ${options.getOption('ollamaBaseUrl')}`);
                    log.info(`Stream request: model=${streamingRequest.model}, messages count=${streamingRequest.messages?.length || 0}`);

                    // Check if we can connect to Ollama by getting available models
                    try {
                        log.info(`Performing Ollama health check...`);
                        const healthCheck = await client.list();
                        log.info(`Ollama health check successful. Available models: ${healthCheck.models.map(m => m.name).join(', ')}`);
                    } catch (healthError) {
                        log.error(`Ollama health check failed: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
                        log.error(`This indicates a connection issue to the Ollama server at ${options.getOption('ollamaBaseUrl')}`);
                        throw new Error(`Unable to connect to Ollama server: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
                    }

                    // Make the streaming request
                    log.info(`Proceeding with Ollama streaming request after successful health check`);
                    streamIterator = await client.chat(streamingRequest);

                    log.info(`Successfully obtained Ollama stream iterator`);

                    if (!streamIterator || typeof streamIterator[Symbol.asyncIterator] !== 'function') {
                        log.error(`Invalid stream iterator returned: ${JSON.stringify(streamIterator)}`);
                        throw new Error('Stream iterator is not valid');
                    }
                } catch (error) {
                    log.error(`Error getting stream iterator: ${error instanceof Error ? error.message : String(error)}`);
                    log.error(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
                    throw error;
                }

                // Process each chunk
                try {
                    log.info(`About to start processing stream chunks`);
                    for await (const chunk of streamIterator) {
                        chunkCount++;

                        // Log first chunk and then periodic updates
                        if (chunkCount === 1 || chunkCount % 10 === 0) {
                            log.info(`Processing Ollama stream chunk #${chunkCount}, done=${!!chunk.done}, has content=${!!chunk.message?.content}`);
                        }

                        // Accumulate text
                        if (chunk.message?.content) {
                            const newContent = chunk.message.content;
                            completeText += newContent;

                            if (chunkCount === 1) {
                                log.info(`First content chunk received: "${newContent.substring(0, 50)}${newContent.length > 50 ? '...' : ''}"`);
                            }
                        }

                        // Check for tool calls
                        if (chunk.message?.tool_calls && chunk.message.tool_calls.length > 0) {
                            responseToolCalls = [...chunk.message.tool_calls];
                            log.info(`Received tool calls in stream: ${chunk.message.tool_calls.length} tools`);
                        }

                        // Send the chunk to the caller
                        await callback({
                            text: chunk.message?.content || '',
                            done: !!chunk.done,
                            raw: chunk // Include the raw chunk for advanced processing
                        });

                        // If this is the done chunk, log it
                        if (chunk.done) {
                            log.info(`Reached final chunk (done=true) after ${chunkCount} chunks, total content length: ${completeText.length}`);
                        }
                    }

                    log.info(`Completed streaming from Ollama: processed ${chunkCount} chunks, total content: ${completeText.length} chars`);

                    // Signal completion
                    await callback({
                        text: '',
                        done: true
                    });
                } catch (streamProcessError) {
                    log.error(`Error processing Ollama stream: ${streamProcessError instanceof Error ? streamProcessError.message : String(streamProcessError)}`);
                    log.error(`Stream process error stack: ${streamProcessError instanceof Error ? streamProcessError.stack : 'No stack trace'}`);

                    // Try to signal completion with error
                    try {
                        await callback({
                            text: '',
                            done: true,
                            raw: { error: streamProcessError instanceof Error ? streamProcessError.message : String(streamProcessError) }
                        });
                    } catch (finalError) {
                        log.error(`Error sending final error chunk: ${finalError}`);
                    }

                    throw streamProcessError;
                }

                return completeText;
            } catch (error) {
                log.error(`Error in Ollama streaming: ${error}`);
                log.error(`Error details: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
                throw error;
            }
        };

        // Handle direct streamCallback if provided
        if (opts.streamCallback) {
            let completeText = '';
            let responseToolCalls: any[] = [];
            let finalChunk: OllamaChatResponse | null = null;
            let chunkCount = 0;

            try {
                // Create streaming request
                const streamingRequest = {
                    ...requestOptions,
                    stream: true as const
                };

                log.info(`Starting Ollama direct streamCallback processing with model ${providerOptions.model}`);

                // Get the async iterator
                log.info(`Calling Ollama chat API for direct streaming`);
                let streamIterator;
                try {
                    log.info(`About to call client.chat with streaming request to ${options.getOption('ollamaBaseUrl')}`);
                    log.info(`Model: ${streamingRequest.model}, Stream: ${streamingRequest.stream}`);
                    log.info(`Messages count: ${streamingRequest.messages.length}`);
                    log.info(`First message: role=${streamingRequest.messages[0].role}, content preview=${streamingRequest.messages[0].content?.substring(0, 50) || 'empty'}`);

                    // Perform health check before streaming
                    try {
                        log.info(`Performing Ollama health check before direct streaming...`);
                        const healthCheck = await client.list();
                        log.info(`Ollama health check successful. Available models: ${healthCheck.models.map(m => m.name).join(', ')}`);
                    } catch (healthError) {
                        log.error(`Ollama health check failed: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
                        log.error(`This indicates a connection issue to the Ollama server at ${options.getOption('ollamaBaseUrl')}`);
                        throw new Error(`Unable to connect to Ollama server: ${healthError instanceof Error ? healthError.message : String(healthError)}`);
                    }

                    // Proceed with streaming after successful health check
                    log.info(`Making Ollama streaming request after successful health check`);
                    streamIterator = await client.chat(streamingRequest);

                    log.info(`Successfully obtained Ollama stream iterator for direct callback`);

                    // Check if the stream iterator is valid
                    if (!streamIterator || typeof streamIterator[Symbol.asyncIterator] !== 'function') {
                        log.error(`Invalid stream iterator returned from Ollama: ${JSON.stringify(streamIterator)}`);
                        throw new Error('Invalid stream iterator returned from Ollama');
                    }

                    log.info(`Stream iterator is valid, beginning processing`);
                } catch (error) {
                    log.error(`Error getting stream iterator from Ollama: ${error instanceof Error ? error.message : String(error)}`);
                    log.error(`Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
                    throw error;
                }

                // Process each chunk
                try {
                    log.info(`Starting to iterate through stream chunks`);
                    for await (const chunk of streamIterator) {
                        chunkCount++;
                        finalChunk = chunk;

                        // Log first chunk and periodic updates
                        if (chunkCount === 1 || chunkCount % 10 === 0) {
                        log.info(`Processing Ollama direct stream chunk #${chunkCount}, done=${!!chunk.done}, has content=${!!chunk.message?.content}`);
                    }

                    // Accumulate text
                    if (chunk.message?.content) {
                        const newContent = chunk.message.content;
                        completeText += newContent;

                        if (chunkCount === 1) {
                            log.info(`First direct content chunk: "${newContent.substring(0, 50)}${newContent.length > 50 ? '...' : ''}"`);
                        }
                    }

                    // Check for tool calls
                    if (chunk.message?.tool_calls && chunk.message.tool_calls.length > 0) {
                        responseToolCalls = [...chunk.message.tool_calls];
                        log.info(`Received tool calls in direct stream: ${chunk.message.tool_calls.length} tools`);
                    }

                    // Call the callback with the current chunk content
                    if (opts.streamCallback) {
                        try {
                            // For the final chunk, make sure to send the complete text with done=true
                            if (chunk.done) {
                                log.info(`Sending final callback with done=true and complete content (${completeText.length} chars)`);
                                await opts.streamCallback(
                                    completeText, // Send the full accumulated content for the final chunk
                                    true,
                                    { ...chunk, message: { ...chunk.message, content: completeText } }
                                );
                            } else if (chunk.message?.content) {
                                // For content chunks, send them as they come
                                await opts.streamCallback(
                                    chunk.message.content,
                                    !!chunk.done,
                                    chunk
                                );
                            } else if (chunk.message?.tool_calls && chunk.message.tool_calls.length > 0) {
                                // For tool call chunks, send an empty content string but include the tool calls
                                await opts.streamCallback(
                                    '',
                                    !!chunk.done,
                                    chunk
                                );
                            }

                            if (chunkCount === 1) {
                                log.info(`Successfully called streamCallback with first chunk`);
                            }
                        } catch (callbackError) {
                            log.error(`Error in streamCallback: ${callbackError}`);
                        }
                    }

                    // If this is the done chunk, log it
                    if (chunk.done) {
                        log.info(`Reached final direct chunk (done=true) after ${chunkCount} chunks, total content length: ${completeText.length}`);
                    }
                }

                log.info(`Completed direct streaming from Ollama: processed ${chunkCount} chunks, final content: ${completeText.length} chars`);
                } catch (iterationError) {
                    log.error(`Error iterating through Ollama stream chunks: ${iterationError instanceof Error ? iterationError.message : String(iterationError)}`);
                    log.error(`Iteration error stack: ${iterationError instanceof Error ? iterationError.stack : 'No stack trace'}`);
                    throw iterationError;
                }

                // Create the final response after streaming is complete
                return {
                    text: completeText,
                    model: providerOptions.model,
                    provider: this.getName(),
                    tool_calls: this.transformToolCalls(responseToolCalls),
                    usage: {
                        promptTokens: finalChunk?.prompt_eval_count || 0,
                        completionTokens: finalChunk?.eval_count || 0,
                        totalTokens: (finalChunk?.prompt_eval_count || 0) + (finalChunk?.eval_count || 0)
                    }
                };
            } catch (error) {
                log.error(`Error in Ollama streaming with callback: ${error}`);
                log.error(`Error details: ${error instanceof Error ? error.stack : 'No stack trace available'}`);
                throw error;
            }
        }

        // Return a response object with the stream handler
        return {
            text: '', // Initial text is empty, will be populated during streaming
            model: providerOptions.model,
            provider: this.getName(),
            stream: streamHandler
        };
    }

    /**
     * Transform Ollama tool calls to the standard format expected by the pipeline
     */
    private transformToolCalls(toolCalls: any[] | undefined): ToolCall[] {
        if (!toolCalls || !Array.isArray(toolCalls) || toolCalls.length === 0) {
            return [];
        }

        return toolCalls.map((toolCall, index) => {
            // Generate a unique ID if none is provided
            const id = toolCall.id || `tool-call-${Date.now()}-${index}`;

            // Handle arguments based on their type
            let processedArguments: Record<string, any> | string = toolCall.function?.arguments || {};

            if (typeof processedArguments === 'string') {
                try {
                    processedArguments = JSON.parse(processedArguments);
                } catch (error) {
                    // If we can't parse as JSON, create a simple object
                    log.info(`Could not parse tool arguments as JSON in transformToolCalls: ${error}`);
                    processedArguments = { raw: processedArguments };
                }
            }

            return {
                id,
                type: 'function',
                function: {
                    name: toolCall.function?.name || '',
                    arguments: processedArguments
                }
            };
        });
    }

    /**
     * Adds a system message with feedback about tool execution status
     * @param messages The current message array
     * @param toolExecutionStatus Array of tool execution status objects
     * @returns Updated message array with feedback
     */
    private addToolExecutionFeedback(messages: Message[], toolExecutionStatus: ToolExecutionStatus[]): Message[] {
        if (!toolExecutionStatus || toolExecutionStatus.length === 0) {
            return messages;
        }

        // Create a copy of the messages
        const updatedMessages = [...messages];

        // Create a feedback message that explains what happened with each tool call
        let feedbackContent = `Tool execution feedback:\n\n`;

        toolExecutionStatus.forEach((status, index) => {
            // Add status for each tool
            const statusText = status.success ? 'successfully executed' : 'failed to execute';
            const toolName = status.name || 'unknown tool';

            feedbackContent += `Tool call ${index + 1} (${toolName}): ${statusText}\n`;

            // Add error information if available and tool failed
            if (!status.success && status.error) {
                feedbackContent += `Error: ${status.error}\n`;
                feedbackContent += `Please fix this issue in your next response or try a different approach.\n`;
            }

            feedbackContent += `\n`;
        });

        // Add feedback message to the conversation
        updatedMessages.push({
            role: 'system',
            content: feedbackContent
        });

        log.info(`Added tool execution feedback: ${toolExecutionStatus.length} statuses`);
        return updatedMessages;
    }
}
