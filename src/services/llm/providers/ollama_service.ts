import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { Message, ChatCompletionOptions, ChatResponse } from '../ai_interface.js';
import sanitizeHtml from 'sanitize-html';
import { OllamaMessageFormatter } from '../formatters/ollama_formatter.js';
import log from '../../log.js';
import type { ToolCall } from '../tools/tool_interfaces.js';
import toolRegistry from '../tools/tool_registry.js';
import type { OllamaOptions } from './provider_options.js';
import { getOllamaOptions } from './providers.js';

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

            // Build request body base
            const requestBody: any = {
                model: providerOptions.model,
                messages: messagesToSend
            };


            log.info(`Stream: ${providerOptions.stream}`);
            // Stream is a top-level option
            if (providerOptions.stream !== undefined) {
                requestBody.stream = providerOptions.stream;
            }

            // Add options object if provided
            if (providerOptions.options) {
                requestBody.options = { ...providerOptions.options };
            }

            // Add tools if enabled
            if (providerOptions.enableTools !== false) {
                // Use provided tools or get from registry
                try {
                    requestBody.tools = providerOptions.tools && providerOptions.tools.length > 0
                        ? providerOptions.tools
                        : toolRegistry.getAllToolDefinitions();

                    // Handle empty tools array
                    if (requestBody.tools.length === 0) {
                        log.info('No tools found, attempting to initialize tools...');
                        const toolInitializer = await import('../tools/tool_initializer.js');
                        await toolInitializer.default.initializeTools();
                        requestBody.tools = toolRegistry.getAllToolDefinitions();
                        log.info(`After initialization: ${requestBody.tools.length} tools available`);
                    }
                } catch (error: any) {
                    log.error(`Error preparing tools: ${error.message || String(error)}`);
                    requestBody.tools = []; // Empty fallback
                }
            }

            // Log request details
            log.info(`========== OLLAMA API REQUEST ==========`);
            log.info(`Model: ${requestBody.model}, Messages: ${requestBody.messages.length}, Tools: ${requestBody.tools ? requestBody.tools.length : 0}`);
            log.info(`Stream: ${requestBody.stream || false}, JSON response expected: ${providerOptions.expectsJsonResponse}`);
            if (requestBody.options) {
                log.info(`Options: ${JSON.stringify(requestBody.options)}`);
            }

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
            log.info(`Full request: ${requestStr}`);
            log.info(`========== END FULL OLLAMA REQUEST ==========`);

            // Send the request
            const response = await fetch(`${providerOptions.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const contentPreview = data.message.content && data.message.content.length > 300
                ? `${data.message.content.substring(0, 300)}...`
                : data.message.content;
            log.info(`Response content: ${contentPreview}`);

            // Log the full raw response for debugging
            log.info(`========== FULL OLLAMA RESPONSE ==========`);
            log.info(`Raw response object: ${JSON.stringify(data)}`);

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
                                // Use reparsed arguments if successful
                                processedArguments = reparseArg;
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

                    // If arguments are still empty or invalid, create a default argument
                    if (!processedArguments ||
                        (typeof processedArguments === 'object' && Object.keys(processedArguments).length === 0)) {
                        log.info(`  Empty or invalid arguments for tool ${toolCall.function.name}, creating default`);

                        // Get tool definition to determine required parameters
                        const allToolDefs = toolRegistry.getAllToolDefinitions();
                        const toolDef = allToolDefs.find(t => t.function?.name === toolCall.function.name);

                        if (toolDef && toolDef.function && toolDef.function.parameters) {
                            const params = toolDef.function.parameters;
                            processedArguments = {};

                            // Create default values for required parameters
                            if (params.required && Array.isArray(params.required)) {
                                params.required.forEach((param: string) => {
                                    // Extract text from the response to use as default value
                                    const defaultValue = data.message.content?.includes(param)
                                        ? extractValueFromText(data.message.content, param)
                                        : "default";

                                    (processedArguments as Record<string, any>)[param] = defaultValue;
                                    log.info(`    Added default value for required param ${param}: ${defaultValue}`);
                                });
                            }
                        }
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

                // Attempt to analyze the response to see if it contains tool call intent
                const responseText = data.message.content || '';
                if (responseText.includes('search_notes') ||
                    responseText.includes('create_note') ||
                    responseText.includes('function') ||
                    responseText.includes('tool')) {
                    log.info(`Response may contain tool call intent but isn't formatted properly`);
                    log.info(`Content that might indicate tool call intent: ${responseText.substring(0, 500)}`);
                }
            }

            log.info(`========== END OLLAMA RESPONSE ==========`);
            return chatResponse;
        } catch (error: any) {
            // Enhanced error handling with detailed diagnostics
            log.error(`Ollama service error: ${error.message || String(error)}`);
            if (error.stack) {
                log.error(`Error stack trace: ${error.stack}`);
            }

            if (error.message && error.message.includes('Cannot read properties of null')) {
                log.error('Tool registry connection issue detected. Tool may not be properly registered or available.');
                log.error('Check tool registry initialization and tool availability before execution.');
            }

            // Propagate the original error
            throw error;
        }
    }

    /**
     * Gets the context window size in tokens for a given model
     * @param modelName The name of the model
     * @returns The context window size in tokens
     */
    private async getModelContextWindowTokens(modelName: string): Promise<number> {
        try {
            // Import model capabilities service
            const modelCapabilitiesService = (await import('../model_capabilities_service.js')).default;

            // Get model capabilities
            const modelCapabilities = await modelCapabilitiesService.getModelCapabilities(modelName);

            // Get context window tokens with a default fallback
            const contextWindowTokens = modelCapabilities.contextWindowTokens || 8192;

            log.info(`Using context window size for ${modelName}: ${contextWindowTokens} tokens`);

            return contextWindowTokens;
        } catch (error: any) {
            // Log error but provide a reasonable default
            log.error(`Error getting model context window: ${error.message}`);
            return 8192; // Default to 8192 tokens if there's an error
        }
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

/**
 * Simple utility to extract a value from text based on a parameter name
 * @param text The text to search in
 * @param param The parameter name to look for
 * @returns Extracted value or default
 */
function extractValueFromText(text: string, param: string): string {
    // Simple regex to find "param: value" or "param = value" or "param value" patterns
    const patterns = [
        new RegExp(`${param}[\\s]*:[\\s]*["']?([^"',\\s]+)["']?`, 'i'),
        new RegExp(`${param}[\\s]*=[\\s]*["']?([^"',\\s]+)["']?`, 'i'),
        new RegExp(`${param}[\\s]+["']?([^"',\\s]+)["']?`, 'i')
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return "default_value";
}
