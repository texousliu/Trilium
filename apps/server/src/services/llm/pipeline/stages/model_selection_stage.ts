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
    getProviderPrecedence,
    getPreferredProvider,
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

        // Get default provider and model using the new configuration system
        let defaultProvider: ProviderType = 'openai';
        let defaultModelName = 'gpt-3.5-turbo';

        try {
            // Use the new configuration helpers - no string parsing!
            defaultProvider = await getPreferredProvider();
            defaultModelName = await getDefaultModelForProvider(defaultProvider);

            log.info(`Selected provider: ${defaultProvider}, model: ${defaultModelName}`);
        } catch (error) {
            // If any error occurs, use the fallback default
            log.error(`Error determining default model: ${error}`);
            defaultProvider = 'openai';
            defaultModelName = 'gpt-3.5-turbo';
        }

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

        // Set the model and add provider metadata
        updatedOptions.model = defaultModelName;
        this.addProviderMetadata(updatedOptions, defaultProvider as ServiceProviders, defaultModelName);

        log.info(`Selected model: ${defaultModelName} from provider: ${defaultProvider} for query complexity: ${queryComplexity}`);
        log.info(`[ModelSelectionStage] Final options: ${JSON.stringify({
            model: updatedOptions.model,
            stream: updatedOptions.stream,
            provider: defaultProvider,
            enableTools: updatedOptions.enableTools
        })}`);

        return { options: updatedOptions };
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
     * Determine model based on provider precedence using the new configuration system
     */
    private async determineDefaultModel(input: ModelSelectionInput): Promise<string> {
        try {
            // Use the new configuration system
            const providers = await getProviderPrecedence();

            // Use only providers that are available
            const availableProviders = providers.filter(provider =>
                aiServiceManager.isProviderAvailable(provider));

            if (availableProviders.length === 0) {
                throw new Error('No AI providers are available');
            }

            // Get the first available provider and its default model
            const defaultProvider = availableProviders[0];
            const defaultModel = await getDefaultModelForProvider(defaultProvider);

            // Set provider metadata
            if (!input.options.providerMetadata) {
                input.options.providerMetadata = {
                    provider: defaultProvider as 'openai' | 'anthropic' | 'ollama' | 'local',
                    modelId: defaultModel
                };
            }

            log.info(`Selected default model ${defaultModel} from provider ${defaultProvider}`);
            return defaultModel;
        } catch (error) {
            log.error(`Error determining default model: ${error}`);
            // Fallback to hardcoded default
            return 'gpt-3.5-turbo';
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
}
