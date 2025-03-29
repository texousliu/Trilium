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

        // Get default model from options
        const defaultModel = await options.getOption('aiDefaultModel') || 'openai:gpt-3.5-turbo';

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

        // Select model based on complexity
        if (queryComplexity === 'high') {
            // Use more powerful model for complex queries
            const advancedModel = await options.getOption('aiAdvancedModel') || 'openai:gpt-4-turbo';
            updatedOptions.model = advancedModel;
            // May also increase context window and reduce temperature for complex tasks
            if (!updatedOptions.temperature) updatedOptions.temperature = 0.3;
        } else if (queryComplexity === 'medium') {
            // Use standard model with moderate settings
            updatedOptions.model = defaultModel;
            if (!updatedOptions.temperature) updatedOptions.temperature = 0.5;
        } else {
            // Use default model with standard settings for simple queries
            updatedOptions.model = defaultModel;
            if (!updatedOptions.temperature) updatedOptions.temperature = 0.7;
        }

        log.info(`Selected model: ${updatedOptions.model} for query complexity: ${queryComplexity}`);
        return { options: updatedOptions };
    }
}
