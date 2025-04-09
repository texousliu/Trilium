import { BasePipelineStage } from '../pipeline_stage.js';
import type { LLMCompletionInput } from '../interfaces.js';
import type { ChatResponse } from '../../ai_interface.js';
import aiServiceManager from '../../ai_service_manager.js';
import toolRegistry from '../../tools/tool_registry.js';
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

        // Create a copy of options to avoid modifying the original
        const updatedOptions = { ...options };

        // Check if tools should be enabled
        if (updatedOptions.enableTools !== false) {
            // Get all available tools from the registry
            const toolDefinitions = toolRegistry.getAllToolDefinitions();

            if (toolDefinitions.length > 0) {
                // Enable tools and add them to the options
                updatedOptions.enableTools = true;
                updatedOptions.tools = toolDefinitions;
                log.info(`Adding ${toolDefinitions.length} tools to LLM request`);
            }
        }

        // Determine which provider to use - prioritize in this order:
        // 1. Explicit provider parameter (legacy approach)
        // 2. Provider from metadata
        // 3. Auto-selection
        let selectedProvider = provider;

        // If no explicit provider is specified, check for provider metadata
        if (!selectedProvider && updatedOptions.providerMetadata?.provider) {
            selectedProvider = updatedOptions.providerMetadata.provider;
            log.info(`Using provider ${selectedProvider} from metadata for model ${updatedOptions.model}`);
        }

        log.info(`Generating LLM completion, provider: ${selectedProvider || 'auto'}, model: ${updatedOptions?.model || 'default'}`);

        // If provider is specified (either explicit or from metadata), use that specific provider
        if (selectedProvider && aiServiceManager.isProviderAvailable(selectedProvider)) {
            const service = aiServiceManager.getService(selectedProvider);
            const response = await service.generateChatCompletion(messages, updatedOptions);
            return { response };
        }

        // Otherwise use the service manager to select an available provider
        const response = await aiServiceManager.generateChatCompletion(messages, updatedOptions);
        return { response };
    }
}
