import { BasePipelineStage } from '../pipeline_stage.js';
import type { ModelSelectionInput } from '../interfaces.js';
import type { ChatCompletionOptions } from '../../ai_interface.js';
import type { ModelMetadata } from '../../providers/provider_options.js';
import log from '../../../log.js';
import aiServiceManager from '../../ai_service_manager.js';
import { SEARCH_CONSTANTS, MODEL_CAPABILITIES } from "../../constants/search_constants.js";

// Import types
import type { ServiceProviders } from '../../interfaces/ai_service_interfaces.js';

// Import new configuration system
import {
    getSelectedProvider,
    parseModelIdentifier,
    getDefaultModelForProvider,
    createModelConfig
} from '../../config/configuration_helpers.js';
import type { ProviderType } from '../../interfaces/configuration_interfaces.js';

/**
 * Pipeline stage for selecting the appropriate LLM model
 */
export class ModelSelectionStage extends BasePipelineStage<ModelSelectionInput, { options: ChatCompletionOptions }> {
    constructor() {
        super('ModelSelection');
    }
    /**
     * Select the appropriate model based on input complexity
     */
    protected async process(input: ModelSelectionInput): Promise<{ options: ChatCompletionOptions }> {
        const { options: inputOptions, query, contentLength } = input;

        // Log input options
        log.info(`[ModelSelectionStage] Input options: ${JSON.stringify({
            model: inputOptions?.model,
            stream: inputOptions?.stream,
            enableTools: inputOptions?.enableTools
        })}`);
        log.info(`[ModelSelectionStage] Stream option in input: ${inputOptions?.stream}, type: ${typeof inputOptions?.stream}`);

        // Start with provided options or create a new object
        const updatedOptions: ChatCompletionOptions = { ...(inputOptions || {}) };

        // Preserve the stream option exactly as it was provided, including undefined state
        // This is critical for ensuring the stream option propagates correctly down the pipeline
        log.info(`[ModelSelectionStage] After copy, stream: ${updatedOptions.stream}, type: ${typeof updatedOptions.stream}`);

        // If model already specified, don't override it
        if (updatedOptions.model) {
            // Use the new configuration system to parse model identifier
            const modelIdentifier = parseModelIdentifier(updatedOptions.model);

            if (modelIdentifier.provider) {
                // Add provider metadata for backward compatibility
                this.addProviderMetadata(updatedOptions, modelIdentifier.provider as ServiceProviders, modelIdentifier.modelId);
                // Update the model to be just the model name without provider prefix
                updatedOptions.model = modelIdentifier.modelId;
                log.info(`Using explicitly specified model: ${modelIdentifier.modelId} from provider: ${modelIdentifier.provider}`);
            } else {
                log.info(`Using explicitly specified model: ${updatedOptions.model}`);
            }

            log.info(`[ModelSelectionStage] Returning early with stream: ${updatedOptions.stream}`);
            return { options: updatedOptions };
        }

        // Enable tools by default unless explicitly disabled
        updatedOptions.enableTools = updatedOptions.enableTools !== false;

        // Add tools if not already provided
        if (updatedOptions.enableTools && (!updatedOptions.tools || updatedOptions.tools.length === 0)) {
            try {
                // Import tool registry and fetch tool definitions
                const toolRegistry = (await import('../../tools/tool_registry.js')).default;
                const toolDefinitions = toolRegistry.getAllToolDefinitions();

                if (toolDefinitions.length > 0) {
                    updatedOptions.tools = toolDefinitions;
                    log.info(`Added ${toolDefinitions.length} tools to options`);
                } else {
                    // Try to initialize tools
                    log.info('No tools found in registry, trying to initialize them');
                    try {
                        // Tools are already initialized in the AIServiceManager constructor
                        // No need to initialize them again

                        // Try again after initialization
                        const reinitToolDefinitions = toolRegistry.getAllToolDefinitions();
                        updatedOptions.tools = reinitToolDefinitions;
                        log.info(`After initialization, added ${reinitToolDefinitions.length} tools to options`);
                    } catch (initError: any) {
                        log.error(`Failed to initialize tools: ${initError.message}`);
                    }
                }
            } catch (error: any) {
                log.error(`Error loading tools: ${error.message}`);
            }
        }

        // Get selected provider and model using the new configuration system
        try {
            // Use the configuration helpers to get a validated model config
            const selectedProvider = await getSelectedProvider();

            if (!selectedProvider) {
                throw new Error('No AI provider is selected. Please select a provider in your AI settings.');
            }

            // First try to get a valid model config (this checks both selection and configuration)
            const { getValidModelConfig } = await import('../../config/configuration_helpers.js');
            const modelConfig = await getValidModelConfig(selectedProvider);

            if (modelConfig) {
                // We have a valid configured model
                updatedOptions.model = modelConfig.model;
            } else {
                // No model configured, try to fetch and set a default from the service
                const fetchedModel = await this.fetchAndSetDefaultModel(selectedProvider);
                if (!fetchedModel) {
                    throw new Error(`No default model configured for provider ${selectedProvider}. Please set a default model in your AI settings or ensure the provider service is available.`);
                }
                // Use the fetched model
                updatedOptions.model = fetchedModel;
            }

            log.info(`Selected provider: ${selectedProvider}, model: ${updatedOptions.model}`);

            // Determine query complexity
            let queryComplexity = 'low';
            if (query) {
                // Simple heuristic: longer queries or those with complex terms indicate higher complexity
                const complexityIndicators = [
                    'explain', 'analyze', 'compare', 'evaluate', 'synthesize',
                    'summarize', 'elaborate', 'investigate', 'research', 'debate'
                ];

                const hasComplexTerms = complexityIndicators.some(term => query.toLowerCase().includes(term));
                const isLongQuery = query.length > 100;
                const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;

                if ((hasComplexTerms && isLongQuery) || hasMultipleQuestions) {
                    queryComplexity = 'high';
                } else if (hasComplexTerms || isLongQuery) {
                    queryComplexity = 'medium';
                }
            }

            // Check content length if provided
            if (contentLength && contentLength > SEARCH_CONSTANTS.CONTEXT.CONTENT_LENGTH.MEDIUM_THRESHOLD) {
                // For large content, favor more powerful models
                queryComplexity = contentLength > SEARCH_CONSTANTS.CONTEXT.CONTENT_LENGTH.HIGH_THRESHOLD ? 'high' : 'medium';
            }

            // Add provider metadata (model is already set above)
            this.addProviderMetadata(updatedOptions, selectedProvider as ServiceProviders, updatedOptions.model);

            log.info(`Selected model: ${updatedOptions.model} from provider: ${selectedProvider} for query complexity: ${queryComplexity}`);
            log.info(`[ModelSelectionStage] Final options: ${JSON.stringify({
                model: updatedOptions.model,
                stream: updatedOptions.stream,
                provider: selectedProvider,
                enableTools: updatedOptions.enableTools
            })}`);

            return { options: updatedOptions };
        } catch (error) {
            log.error(`Error determining default model: ${error}`);
            throw new Error(`Failed to determine AI model configuration: ${error}`);
        }
    }

    /**
     * Add provider metadata to the options based on model name
     */
    private addProviderMetadata(options: ChatCompletionOptions, provider: ServiceProviders, modelName: string): void {
        // Check if we already have providerMetadata
        if (options.providerMetadata) {
            // If providerMetadata exists but not modelId, add the model name
            if (!options.providerMetadata.modelId && modelName) {
                options.providerMetadata.modelId = modelName;
            }
            return;
        }

        // If no provider could be determined, try to use precedence
        let selectedProvider = provider;
        if (!selectedProvider) {
            // List of providers in precedence order
            const providerPrecedence = ['anthropic', 'openai', 'ollama'];

            // Find the first available provider
            for (const p of providerPrecedence) {
                if (aiServiceManager.isProviderAvailable(p)) {
                    selectedProvider = p as ServiceProviders;
                    break;
                }
            }
        }

        // Set the provider metadata in the options
        if (selectedProvider) {
            // Ensure the provider is one of the valid types
            const validProvider = selectedProvider as 'openai' | 'anthropic' | 'ollama' | 'local';

            options.providerMetadata = {
                provider: validProvider,
                modelId: modelName
            };

            // For backward compatibility, ensure model name is set without prefix
            if (options.model && options.model.includes(':')) {
                const parsed = parseModelIdentifier(options.model);
                options.model = modelName || parsed.modelId;
            }

            log.info(`Set provider metadata: provider=${selectedProvider}, model=${modelName}`);
        }
    }

    /**
     * Determine model based on selected provider using the new configuration system
     * This method is now simplified and delegates to the main model selection logic
     */
    private async determineDefaultModel(input: ModelSelectionInput): Promise<string> {
        try {
            // Use the same logic as the main process method
            const { getValidModelConfig, getSelectedProvider } = await import('../../config/configuration_helpers.js');
            const selectedProvider = await getSelectedProvider();

            if (!selectedProvider) {
                throw new Error('No AI provider is selected. Please select a provider in your AI settings.');
            }

            // Check if the provider is available through the service manager
            if (!aiServiceManager.isProviderAvailable(selectedProvider)) {
                throw new Error(`Selected provider ${selectedProvider} is not available`);
            }

            // Try to get a valid model config
            const modelConfig = await getValidModelConfig(selectedProvider);
            
            if (!modelConfig) {
                throw new Error(`No default model configured for provider ${selectedProvider}. Please configure a default model in your AI settings.`);
            }

            // Set provider metadata
            if (!input.options.providerMetadata) {
                input.options.providerMetadata = {
                    provider: selectedProvider as 'openai' | 'anthropic' | 'ollama' | 'local',
                    modelId: modelConfig.model
                };
            }

            log.info(`Selected default model ${modelConfig.model} from provider ${selectedProvider}`);
            return modelConfig.model;
        } catch (error) {
            log.error(`Error determining default model: ${error}`);
            throw error; // Don't provide fallback defaults, let the error propagate
        }
    }

    /**
     * Get estimated context window for Ollama models
     */
    private getOllamaContextWindow(model: string): number {
        // Try to find exact matches in MODEL_CAPABILITIES
        if (model in MODEL_CAPABILITIES) {
            return MODEL_CAPABILITIES[model as keyof typeof MODEL_CAPABILITIES].contextWindowTokens;
        }

        // Estimate based on model family
        if (model.includes('llama3')) {
            return MODEL_CAPABILITIES['gpt-4'].contextWindowTokens;
        } else if (model.includes('llama2')) {
            return MODEL_CAPABILITIES['default'].contextWindowTokens;
        } else if (model.includes('mistral') || model.includes('mixtral')) {
            return MODEL_CAPABILITIES['gpt-4'].contextWindowTokens;
        } else if (model.includes('gemma')) {
            return MODEL_CAPABILITIES['gpt-4'].contextWindowTokens;
        } else {
            return MODEL_CAPABILITIES['default'].contextWindowTokens;
        }
    }

    /**
     * Use AI service manager to get a configured model for the provider
     * This eliminates duplication and uses the existing service layer
     */
    private async fetchAndSetDefaultModel(provider: ProviderType): Promise<string | null> {
        try {
            log.info(`Getting default model for provider ${provider} using AI service manager`);
            
            // Use the existing AI service manager instead of duplicating API calls
            const service = aiServiceManager.getInstance().getService(provider);
            
            if (!service || !service.isAvailable()) {
                log.info(`Provider ${provider} service is not available`);
                return null;
            }

            // Check if the service has a method to get available models
            if (typeof (service as any).getAvailableModels === 'function') {
                try {
                    const models = await (service as any).getAvailableModels();
                    if (models && models.length > 0) {
                        // Use the first available model - no hardcoded preferences
                        const selectedModel = models[0];
                        
                        // Import server-side options to update the default model
                        const optionService = (await import('../../../options.js')).default;
                        const optionKey = `${provider}DefaultModel` as const;
                        
                        await optionService.setOption(optionKey, selectedModel);
                        log.info(`Set default ${provider} model to: ${selectedModel}`);
                        return selectedModel;
                    }
                } catch (modelError) {
                    log.error(`Error fetching models from ${provider} service: ${modelError}`);
                }
            }
            
            log.info(`Provider ${provider} does not support dynamic model fetching`);
            return null;
        } catch (error) {
            log.error(`Error getting default model for provider ${provider}: ${error}`);
            return null;
        }
    }
}
