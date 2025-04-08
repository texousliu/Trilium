import { BasePipelineStage } from '../pipeline_stage.js';
import type { ModelSelectionInput } from '../interfaces.js';
import type { ChatCompletionOptions } from '../../ai_interface.js';
import log from '../../../log.js';
import options from '../../../options.js';
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

        // Start with provided options or create a new object
        const updatedOptions: ChatCompletionOptions = { ...(inputOptions || {}) };

        // If model already specified, don't override it
        if (updatedOptions.model) {
            log.info(`Using explicitly specified model: ${updatedOptions.model}`);
            return { options: updatedOptions };
        }

        // Get default model based on provider precedence
        let defaultModel = 'openai:gpt-3.5-turbo'; // Fallback default

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
                        const toolInitializer = await import('../../tools/tool_initializer.js');
                        await toolInitializer.default.initializeTools();

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

        try {
            // Get provider precedence list
            const providerPrecedence = await options.getOption('aiProviderPrecedence');
            if (providerPrecedence) {
                // Parse provider precedence list
                let providers = [];
                if (providerPrecedence.includes(',')) {
                    providers = providerPrecedence.split(',').map(p => p.trim());
                } else if (providerPrecedence.startsWith('[') && providerPrecedence.endsWith(']')) {
                    providers = JSON.parse(providerPrecedence);
                } else {
                    providers = [providerPrecedence];
                }

                // Check for first available provider
                if (providers.length > 0) {
                    const firstProvider = providers[0];

                    // Get provider-specific default model
                    if (firstProvider === 'openai') {
                        const model = await options.getOption('openaiDefaultModel');
                        if (model) defaultModel = `openai:${model}`;
                    } else if (firstProvider === 'anthropic') {
                        const model = await options.getOption('anthropicDefaultModel');
                        if (model) defaultModel = `anthropic:${model}`;
                    } else if (firstProvider === 'ollama') {
                        const model = await options.getOption('ollamaDefaultModel');
                        if (model) {
                            defaultModel = `ollama:${model}`;

                            // Enable tools for all Ollama models
                            // The Ollama API will handle models that don't support tool calling
                            log.info(`Using Ollama model ${model} with tool calling enabled`);
                            updatedOptions.enableTools = true;
                        }
                    }
                }
            }
        } catch (error) {
            // If any error occurs, use the fallback default
            log.error(`Error determining default model: ${error}`);
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
        if (contentLength && contentLength > 5000) {
            // For large content, favor more powerful models
            queryComplexity = contentLength > 10000 ? 'high' : 'medium';
        }

        updatedOptions.model = defaultModel;

        log.info(`Selected model: ${updatedOptions.model} for query complexity: ${queryComplexity}`);
        return { options: updatedOptions };
    }
}
