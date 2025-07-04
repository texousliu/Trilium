import { BasePipelineStage } from '../pipeline_stage.js';
import type { MessagePreparationInput } from '../interfaces.js';
import type { Message } from '../../ai_interface.js';
import { SYSTEM_PROMPTS } from '../../constants/llm_prompt_constants.js';
import { MessageFormatterFactory } from '../interfaces/message_formatter.js';
import toolRegistry from '../../tools/tool_registry.js';
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

        // Check if tools are enabled
        const toolsEnabled = options?.enableTools === true;

        log.info(`Preparing messages for provider: ${provider}, context: ${!!context}, system prompt: ${!!systemPrompt}, tools: ${toolsEnabled}`);

        // Get appropriate formatter for this provider
        const formatter = MessageFormatterFactory.getFormatter(provider);

        // Determine the system prompt to use
        let finalSystemPrompt = systemPrompt || SYSTEM_PROMPTS.DEFAULT_SYSTEM_PROMPT;

        // If tools are enabled, enhance system prompt with tools guidance
        if (toolsEnabled) {
            const toolCount = toolRegistry.getAllTools().length;
            const toolsPrompt = `You have access to ${toolCount} tools to help you respond. 

CRITICAL: You are designed for CONTINUOUS TOOL USAGE and ITERATIVE INVESTIGATION. When you receive tool results, this is NOT the end of your analysis - it's the beginning of deeper investigation.

MANDATORY APPROACH:
- After ANY tool execution, immediately analyze the results and plan follow-up actions
- Use multiple tools in sequence to build comprehensive responses
- Chain tools together systematically - use results from one tool to inform the next
- When you find partial information, immediately search for additional details
- Cross-reference findings with alternative search approaches
- Never stop after a single tool unless you have completely fulfilled the request

TOOL CHAINING EXAMPLES:
- If search_notes finds relevant note IDs → immediately use read_note to get full content
- If initial search returns partial results → try broader terms or alternative keywords
- If one search tool fails → immediately try a different search tool
- Use the information from each tool to inform better parameters for subsequent tools

Remember: Tool usage should be continuous and iterative until you have thoroughly investigated the user's request.`;

            // Add tools guidance to system prompt
            finalSystemPrompt = finalSystemPrompt + '\n\n' + toolsPrompt;
            log.info(`Enhanced system prompt with aggressive tool chaining guidance: ${toolCount} tools available`);
        }

        // Format messages using provider-specific approach
        const formattedMessages = formatter.formatMessages(
            messages,
            finalSystemPrompt,
            context
        );

        log.info(`Formatted ${messages.length} messages into ${formattedMessages.length} messages for provider: ${provider}`);

        return { messages: formattedMessages };
    }
}
