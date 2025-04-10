import { BasePipelineStage } from '../pipeline_stage.js';
import type { LLMCompletionInput } from '../interfaces.js';
import type { ChatCompletionOptions, ChatResponse, StreamChunk } from '../../ai_interface.js';
import aiServiceManager from '../../ai_service_manager.js';
import toolRegistry from '../../tools/tool_registry.js';
import log from '../../../log.js';

/**
 * Pipeline stage for LLM completion with enhanced streaming support
 */
export class LLMCompletionStage extends BasePipelineStage<LLMCompletionInput, { response: ChatResponse }> {
    constructor() {
        super('LLMCompletion');
    }

    /**
     * Generate LLM completion using the AI service
     * 
     * This enhanced version supports better streaming by forwarding raw provider data
     * and ensuring consistent handling of stream options.
     */
    protected async process(input: LLMCompletionInput): Promise<{ response: ChatResponse }> {
        const { messages, options, provider } = input;

        // Log input options
        log.info(`[LLMCompletionStage] Input options: ${JSON.stringify({
            model: options.model,
            provider,
            stream: options.stream,
            enableTools: options.enableTools
        })}`);

        // Create a deep copy of options to avoid modifying the original
        const updatedOptions: ChatCompletionOptions = JSON.parse(JSON.stringify(options));

        // Handle stream option explicitly
        if (options.stream !== undefined) {
            updatedOptions.stream = options.stream === true;
            log.info(`[LLMCompletionStage] Stream explicitly set to: ${updatedOptions.stream}`);
        }

        // Add capture of raw provider data for streaming 
        if (updatedOptions.stream) {
            // Add a function to capture raw provider data in stream chunks
            const originalStreamCallback = updatedOptions.streamCallback;
            updatedOptions.streamCallback = async (text, done, rawProviderData) => {
                // Create an enhanced chunk with the raw provider data
                const enhancedChunk = {
                    text, 
                    done,
                    // Include raw provider data if available
                    raw: rawProviderData
                };
                
                // Call the original callback if provided
                if (originalStreamCallback) {
                    return originalStreamCallback(text, done, enhancedChunk);
                }
            };
        }

        // Check if tools should be enabled
        if (updatedOptions.enableTools !== false) {
            const toolDefinitions = toolRegistry.getAllToolDefinitions();
            if (toolDefinitions.length > 0) {
                updatedOptions.enableTools = true;
                updatedOptions.tools = toolDefinitions;
                log.info(`Adding ${toolDefinitions.length} tools to LLM request`);
            }
        }

        // Determine which provider to use
        let selectedProvider = provider;
        if (!selectedProvider && updatedOptions.providerMetadata?.provider) {
            selectedProvider = updatedOptions.providerMetadata.provider;
            log.info(`Using provider ${selectedProvider} from metadata for model ${updatedOptions.model}`);
        }

        log.info(`Generating LLM completion, provider: ${selectedProvider || 'auto'}, model: ${updatedOptions?.model || 'default'}`);

        // Use specific provider if available
        if (selectedProvider && aiServiceManager.isProviderAvailable(selectedProvider)) {
            const service = aiServiceManager.getService(selectedProvider);
            log.info(`[LLMCompletionStage] Using specific service for ${selectedProvider}`);
            
            // Generate completion and wrap with enhanced stream handling
            const response = await service.generateChatCompletion(messages, updatedOptions);
            
            // If streaming is enabled, enhance the stream method
            if (response.stream && typeof response.stream === 'function' && updatedOptions.stream) {
                const originalStream = response.stream;
                
                // Replace the stream method with an enhanced version that captures and forwards raw data
                response.stream = async (callback) => {
                    return originalStream(async (chunk) => {
                        // Forward the chunk with any additional provider-specific data
                        // Create an enhanced chunk with provider info
                        const enhancedChunk: StreamChunk = {
                            ...chunk,
                            // If the provider didn't include raw data, add minimal info
                            raw: chunk.raw || {
                                provider: selectedProvider,
                                model: response.model
                            }
                        };
                        return callback(enhancedChunk);
                    });
                };
            }
            
            return { response };
        }

        // Use auto-selection if no specific provider
        log.info(`[LLMCompletionStage] Using auto-selected service`);
        const response = await aiServiceManager.generateChatCompletion(messages, updatedOptions);
        
        // Add similar stream enhancement for auto-selected provider
        if (response.stream && typeof response.stream === 'function' && updatedOptions.stream) {
            const originalStream = response.stream;
            response.stream = async (callback) => {
                return originalStream(async (chunk) => {
                    // Create an enhanced chunk with provider info
                    const enhancedChunk: StreamChunk = {
                        ...chunk,
                        raw: chunk.raw || {
                            provider: response.provider,
                            model: response.model
                        }
                    };
                    return callback(enhancedChunk);
                });
            };
        }
        
        return { response };
    }
}
