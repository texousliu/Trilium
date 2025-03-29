import { BasePipelineStage } from '../pipeline_stage.js';
import type { LLMCompletionInput } from '../interfaces.js';
import type { ChatResponse } from '../../ai_interface.js';
import aiServiceManager from '../../ai_service_manager.js';
import log from '../../../log.js';

/**
 * Pipeline stage for LLM completion
 */
export class LLMCompletionStage extends BasePipelineStage<LLMCompletionInput, { response: ChatResponse }> {
    constructor() {
        super('LLMCompletion');
    }

    /**
     * Generate LLM completion using the AI service
     */
    protected async process(input: LLMCompletionInput): Promise<{ response: ChatResponse }> {
        const { messages, options, provider } = input;

        log.info(`Generating LLM completion, provider: ${provider || 'auto'}, model: ${options?.model || 'default'}`);

        // If provider is specified, use that specific provider
        if (provider && aiServiceManager.isProviderAvailable(provider)) {
            const service = aiServiceManager.getService(provider);
            const response = await service.generateChatCompletion(messages, options);
            return { response };
        }

        // Otherwise use the service manager to select an available provider
        const response = await aiServiceManager.generateChatCompletion(messages, options);
        return { response };
    }
}
