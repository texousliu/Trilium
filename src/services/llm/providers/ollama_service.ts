import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { Message, ChatCompletionOptions, ChatResponse } from '../ai_interface.js';
import sanitizeHtml from 'sanitize-html';
import { OllamaMessageFormatter } from '../formatters/ollama_formatter.js';
import log from '../../log.js';
import type { ToolCall } from '../tools/tool_interfaces.js';
import toolRegistry from '../tools/tool_registry.js';

interface OllamaFunctionArguments {
    [key: string]: any;
}

interface OllamaFunctionCall {
    function: {
        name: string;
        arguments: OllamaFunctionArguments | string;
    };
    id?: string;
}

interface OllamaMessage {
    role: string;
    content: string;
    tool_calls?: OllamaFunctionCall[];
}

interface OllamaResponse {
    model: string;
    created_at: string;
    message: OllamaMessage;
    done: boolean;
    done_reason?: string;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}

export class OllamaService extends BaseAIService {
    private formatter: OllamaMessageFormatter;

    constructor() {
        super('Ollama');
        this.formatter = new OllamaMessageFormatter();
    }

    isAvailable(): boolean {
        return super.isAvailable() && !!options.getOption('ollamaBaseUrl');
    }

    async generateChatCompletion(messages: Message[], opts: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!this.isAvailable()) {
            throw new Error('Ollama service is not available. Check API URL in settings.');
        }

        const apiBase = options.getOption('ollamaBaseUrl');

        // Get the model name and strip the "ollama:" prefix if it exists
        let model = opts.model || options.getOption('ollamaDefaultModel') || 'llama3';
        if (model.startsWith('ollama:')) {
            model = model.substring(7); // Remove the "ollama:" prefix
            log.info(`Stripped 'ollama:' prefix from model name, using: ${model}`);
        }

        const temperature = opts.temperature !== undefined
            ? opts.temperature
            : parseFloat(options.getOption('aiTemperature') || '0.7');

        const systemPrompt = this.getSystemPrompt(opts.systemPrompt || options.getOption('aiSystemPrompt'));

        try {
            // Determine whether to use the formatter or send messages directly
            let messagesToSend: Message[];

            if (opts.bypassFormatter) {
                // Bypass the formatter entirely - use messages as is
                messagesToSend = [...messages];
                log.info(`Bypassing formatter for Ollama request with ${messages.length} messages`);
            } else {
                // Use the formatter to prepare messages
                messagesToSend = this.formatter.formatMessages(
                    messages,
                    systemPrompt,
                    undefined, // context
                    opts.preserveSystemPrompt
                );
                log.info(`Sending to Ollama with formatted messages: ${messagesToSend.length}`);
            }

            // Check if this is a request that expects JSON response
            const expectsJsonResponse = opts.expectsJsonResponse || false;

            // Build request body
            const requestBody: any = {
                model,
                messages: messagesToSend,
                options: {
                    temperature,
                    // Add response_format for requests that expect JSON
                    ...(expectsJsonResponse ? { response_format: { type: "json_object" } } : {})
                },
                stream: false
            };

            // Add tools if enabled - put them at the top level for Ollama
            if (opts.enableTools !== false) {
                // Get tools from registry if not provided in options
                if (!opts.tools || opts.tools.length === 0) {
                    try {
                        // Get tool definitions from registry
                        const tools = toolRegistry.getAllToolDefinitions();
                        requestBody.tools = tools;
                        log.info(`Adding ${tools.length} tools to request`);

                        // If no tools found, reinitialize
                        if (tools.length === 0) {
                            log.info('No tools found in registry, re-initializing...');
                            try {
                                const toolInitializer = await import('../tools/tool_initializer.js');
                                await toolInitializer.default.initializeTools();

                                // Try again
                                requestBody.tools = toolRegistry.getAllToolDefinitions();
                                log.info(`After re-initialization: ${requestBody.tools.length} tools available`);
                            } catch (err: any) {
                                log.error(`Failed to re-initialize tools: ${err.message}`);
                            }
                        }
                    } catch (error: any) {
                        log.error(`Error getting tools: ${error.message || String(error)}`);
                        // Create default empty tools array if we couldn't load the tools
                        requestBody.tools = [];
                    }
                } else {
                    requestBody.tools = opts.tools;
                }
                log.info(`Adding ${requestBody.tools.length} tools to Ollama request`);
            } else {
                log.info('Tools are explicitly disabled for this request');
            }

            // Log key request details
            log.info(`========== OLLAMA API REQUEST ==========`);
            log.info(`Model: ${requestBody.model}, Messages: ${requestBody.messages.length}, Tools: ${requestBody.tools ? requestBody.tools.length : 0}`);
            log.info(`Temperature: ${temperature}, Stream: ${requestBody.stream}, JSON response expected: ${expectsJsonResponse}`);

            // Check message structure and log detailed information about each message
            requestBody.messages.forEach((msg: any, index: number) => {
                const keys = Object.keys(msg);
                log.info(`Message ${index}, Role: ${msg.role}, Keys: ${keys.join(', ')}`);

                // Log message content preview
                if (msg.content && typeof msg.content === 'string') {
                    const contentPreview = msg.content.length > 200
                        ? `${msg.content.substring(0, 200)}...`
                        : msg.content;
                    log.info(`Message ${index} content: ${contentPreview}`);
                }

                // Log tool-related details
                if (keys.includes('tool_calls')) {
                    log.info(`Message ${index} has ${msg.tool_calls.length} tool calls:`);
                    msg.tool_calls.forEach((call: any, callIdx: number) => {
                        log.info(`  Tool call ${callIdx}: ${call.function?.name || 'unknown'}, ID: ${call.id || 'unspecified'}`);
                        if (call.function?.arguments) {
                            const argsPreview = typeof call.function.arguments === 'string'
                                ? call.function.arguments.substring(0, 100)
                                : JSON.stringify(call.function.arguments).substring(0, 100);
                            log.info(`    Arguments: ${argsPreview}...`);
                        }
                    });
                }

                if (keys.includes('tool_call_id')) {
                    log.info(`Message ${index} is a tool response for tool call ID: ${msg.tool_call_id}`);
                }

                if (keys.includes('name') && msg.role === 'tool') {
                    log.info(`Message ${index} is from tool: ${msg.name}`);
                }
            });

            // Log tool definitions
            if (requestBody.tools && requestBody.tools.length > 0) {
                log.info(`Sending ${requestBody.tools.length} tool definitions:`);
                requestBody.tools.forEach((tool: any, toolIdx: number) => {
                    log.info(`  Tool ${toolIdx}: ${tool.function?.name || 'unnamed'}`);
                    if (tool.function?.description) {
                        log.info(`    Description: ${tool.function.description.substring(0, 100)}...`);
                    }
                    if (tool.function?.parameters) {
                        const paramNames = tool.function.parameters.properties
                            ? Object.keys(tool.function.parameters.properties)
                            : [];
                        log.info(`    Parameters: ${paramNames.join(', ')}`);
                    }
                });
            }

            // Log full request body (with improved logging for debug purposes)
            const requestStr = JSON.stringify(requestBody);
            log.info(`========== FULL OLLAMA REQUEST ==========`);

            // Log request in manageable chunks
            const maxChunkSize = 4000;
            if (requestStr.length > maxChunkSize) {
                let i = 0;
                while (i < requestStr.length) {
                    const chunk = requestStr.substring(i, i + maxChunkSize);
                    log.info(`Request part ${Math.floor(i/maxChunkSize) + 1}/${Math.ceil(requestStr.length/maxChunkSize)}: ${chunk}`);
                    i += maxChunkSize;
                }
            } else {
                log.info(`Full request: ${requestStr}`);
            }
            log.info(`========== END FULL OLLAMA REQUEST ==========`);
            log.info(`========== END OLLAMA REQUEST ==========`);

            // Make API request
            const response = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                log.error(`Ollama API error: ${response.status} ${response.statusText} - ${errorBody}`);
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data: OllamaResponse = await response.json();

            // Log response details
            log.info(`========== OLLAMA API RESPONSE ==========`);
            log.info(`Model: ${data.model}, Content length: ${data.message.content.length} chars`);
            log.info(`Tokens: ${data.prompt_eval_count} prompt, ${data.eval_count} completion, ${data.prompt_eval_count + data.eval_count} total`);
            log.info(`Duration: ${data.total_duration}ns total, ${data.prompt_eval_duration}ns prompt, ${data.eval_duration}ns completion`);
            log.info(`Done: ${data.done}, Reason: ${data.done_reason || 'not specified'}`);

            // Log content preview
            const contentPreview = data.message.content.length > 300
                ? `${data.message.content.substring(0, 300)}...`
                : data.message.content;
            log.info(`Response content: ${contentPreview}`);

            // Handle the response and extract tool calls if present
            const chatResponse: ChatResponse = {
                text: data.message.content,
                model: data.model,
                provider: this.getName(),
                usage: {
                    promptTokens: data.prompt_eval_count,
                    completionTokens: data.eval_count,
                    totalTokens: data.prompt_eval_count + data.eval_count
                }
            };

            // Add tool calls if present
            if (data.message.tool_calls && data.message.tool_calls.length > 0) {
                log.info(`========== OLLAMA TOOL CALLS DETECTED ==========`);
                log.info(`Ollama response includes ${data.message.tool_calls.length} tool calls`);

                // Log detailed information about each tool call
                const transformedToolCalls: ToolCall[] = [];

                // Log detailed information about the tool calls in the response
                log.info(`========== OLLAMA TOOL CALLS IN RESPONSE ==========`);
                data.message.tool_calls.forEach((toolCall, index) => {
                    log.info(`Tool call ${index + 1}:`);
                    log.info(`  Name: ${toolCall.function?.name || 'unknown'}`);
                    log.info(`  ID: ${toolCall.id || `auto-${index + 1}`}`);

                    // Generate a unique ID if none is provided
                    const id = toolCall.id || `tool-call-${Date.now()}-${index}`;

                    // Handle arguments based on their type
                    let processedArguments: Record<string, any> | string;

                    if (typeof toolCall.function.arguments === 'string') {
                        // Log raw string arguments in full for debugging
                        log.info(`  Raw string arguments: ${toolCall.function.arguments}`);

                        // Try to parse JSON string arguments
                        try {
                            processedArguments = JSON.parse(toolCall.function.arguments);
                            log.info(`  Successfully parsed arguments to object with keys: ${Object.keys(processedArguments).join(', ')}`);
                            log.info(`  Parsed argument values:`);
                            Object.entries(processedArguments).forEach(([key, value]) => {
                                const valuePreview = typeof value === 'string'
                                    ? (value.length > 100 ? `${value.substring(0, 100)}...` : value)
                                    : JSON.stringify(value);
                                log.info(`    ${key}: ${valuePreview}`);
                            });
                        } catch (e: unknown) {
                            // If parsing fails, keep as string and log the error
                            processedArguments = toolCall.function.arguments;
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            log.info(`  Could not parse arguments as JSON: ${errorMessage}`);
                            log.info(`  Keeping as string: ${processedArguments.substring(0, 200)}${processedArguments.length > 200 ? '...' : ''}`);

                            // Try to clean and parse again with more aggressive methods
                            try {
                                const cleaned = toolCall.function.arguments
                                    .replace(/^['"]|['"]$/g, '') // Remove surrounding quotes
                                    .replace(/\\"/g, '"')        // Replace escaped quotes
                                    .replace(/([{,])\s*'([^']+)'\s*:/g, '$1"$2":') // Replace single quotes around property names
                                    .replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');    // Add quotes around unquoted property names

                                log.info(`  Attempting to parse cleaned argument: ${cleaned}`);
                                const reparseArg = JSON.parse(cleaned);
                                log.info(`  Successfully parsed cleaned argument with keys: ${Object.keys(reparseArg).join(', ')}`);
                            } catch (cleanErr: unknown) {
                                const cleanErrMessage = cleanErr instanceof Error ? cleanErr.message : String(cleanErr);
                                log.info(`  Failed to parse cleaned arguments: ${cleanErrMessage}`);
                            }
                        }
                    } else {
                        // If it's already an object, use it directly and log details
                        processedArguments = toolCall.function.arguments;
                        log.info(`  Object arguments with keys: ${Object.keys(processedArguments).join(', ')}`);
                        log.info(`  Argument values:`);
                        Object.entries(processedArguments).forEach(([key, value]) => {
                            const valuePreview = typeof value === 'string'
                                ? (value.length > 100 ? `${value.substring(0, 100)}...` : value)
                                : JSON.stringify(value);
                            log.info(`    ${key}: ${valuePreview}`);
                        });
                    }

                    // Convert to our standard ToolCall format
                    transformedToolCalls.push({
                        id,
                        type: 'function',
                        function: {
                            name: toolCall.function.name,
                            arguments: processedArguments
                        }
                    });
                });

                // Add transformed tool calls to response
                chatResponse.tool_calls = transformedToolCalls;
                log.info(`Transformed ${transformedToolCalls.length} tool calls for execution`);
                log.info(`Tool calls after transformation: ${JSON.stringify(chatResponse.tool_calls)}`);

                // CRITICAL: Explicitly mark response for tool execution
                log.info(`CRITICAL: Explicitly marking response for tool execution`);

                // Ensure tool_calls is properly exposed and formatted
                // This is to make sure the pipeline can detect and execute the tools
                if (transformedToolCalls.length > 0) {
                    // Make sure the tool_calls are exposed in the exact format expected by pipeline
                    chatResponse.tool_calls = transformedToolCalls.map(tc => ({
                        id: tc.id,
                        type: 'function',
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments
                        }
                    }));

                    // If the content is empty, use a placeholder to avoid issues
                    if (!chatResponse.text) {
                        chatResponse.text = "Processing your request...";
                    }

                    log.info(`Final tool_calls format for pipeline: ${JSON.stringify(chatResponse.tool_calls)}`);
                }
                log.info(`========== END OLLAMA TOOL CALLS ==========`);
            } else {
                log.info(`========== NO OLLAMA TOOL CALLS DETECTED ==========`);
                log.info(`Checking raw message response format: ${JSON.stringify(data.message)}`);
            }

            log.info(`========== END OLLAMA RESPONSE ==========`);
            return chatResponse;
        } catch (error: any) {
            log.error(`Ollama service error: ${error.message || String(error)}`);
            throw error;
        }
    }
}
