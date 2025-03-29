import { BasePipelineStage } from '../pipeline_stage.js';
import type { MessagePreparationInput } from '../interfaces.js';
import type { Message } from '../../ai_interface.js';
import { SYSTEM_PROMPTS } from '../../constants/llm_prompt_constants.js';
import { MessageFormatterFactory } from '../interfaces/message_formatter.js';
import log from '../../../log.js';

/**
 * Pipeline stage for preparing messages for LLM completion
 */
export class MessagePreparationStage extends BasePipelineStage<MessagePreparationInput, { messages: Message[] }> {
    constructor() {
        super('MessagePreparation');
    }

    /**
     * Prepare messages for LLM completion, including system prompt and context
     * This uses provider-specific formatters to optimize the message structure
     */
    protected async process(input: MessagePreparationInput): Promise<{ messages: Message[] }> {
        const { messages, context, systemPrompt, options } = input;
        
        // Determine provider from model string if available (format: "provider:model")
        let provider = 'default';
        if (options?.model && options.model.includes(':')) {
            const [providerName] = options.model.split(':');
            provider = providerName;
        }
        
        log.info(`Preparing messages for provider: ${provider}, context: ${!!context}, system prompt: ${!!systemPrompt}`);
        
        // Get appropriate formatter for this provider
        const formatter = MessageFormatterFactory.getFormatter(provider);
        
        // Format messages using provider-specific approach
        const formattedMessages = formatter.formatMessages(
            messages,
            systemPrompt || SYSTEM_PROMPTS.DEFAULT_SYSTEM_PROMPT,
            context
        );
        
        log.info(`Formatted ${messages.length} messages into ${formattedMessages.length} messages for provider: ${provider}`);
        
        return { messages: formattedMessages };
    }
}
