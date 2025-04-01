import sanitizeHtml from 'sanitize-html';
import type { Message } from '../ai_interface.js';
import { BaseMessageFormatter } from './base_formatter.js';
import { PROVIDER_PROMPTS } from '../constants/llm_prompt_constants.js';
import { LLM_CONSTANTS } from '../constants/provider_constants.js';
import {
    HTML_ALLOWED_TAGS,
    HTML_ALLOWED_ATTRIBUTES,
    FORMATTER_LOGS,
    HTML_TO_MARKDOWN_PATTERNS,
    HTML_ENTITY_REPLACEMENTS
} from '../constants/formatter_constants.js';

/**
 * Anthropic-specific message formatter
 * Optimized for Claude's API and preferences
 */
export class AnthropicMessageFormatter extends BaseMessageFormatter {
    /**
     * Maximum recommended context length for Anthropic models
     * Claude has a very large context window
     */
    private static MAX_CONTEXT_LENGTH = LLM_CONSTANTS.CONTEXT_WINDOW.ANTHROPIC;

    /**
     * Format messages for the Anthropic API
     */
    formatMessages(messages: Message[], systemPrompt?: string, context?: string): Message[] {
        const formattedMessages: Message[] = [];

        // For Anthropic, system prompts work best as the first user message with <instructions> XML tags
        // First, collect all non-system messages
        const userAssistantMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');

        // For Anthropic, we need to handle context differently
        // 1. If explicit context is provided, we format it with XML tags
        if (context) {
            // Build the system message with context
            const formattedContext = PROVIDER_PROMPTS.ANTHROPIC.SYSTEM_WITH_CONTEXT(
                this.cleanContextContent(context)
            );

            // If there's at least one user message, add the context to the first one
            if (userAssistantMessages.length > 0 && userAssistantMessages[0].role === 'user') {
                // Add system as a new first message
                formattedMessages.push({
                    role: 'user',
                    content: formattedContext
                });

                // Add system response acknowledgment
                formattedMessages.push({
                    role: 'assistant',
                    content: PROVIDER_PROMPTS.ANTHROPIC.CONTEXT_ACKNOWLEDGMENT
                });

                // Add remaining messages
                for (const msg of userAssistantMessages) {
                    formattedMessages.push(msg);
                }
            }
            // If no user messages, create a placeholder
            else {
                formattedMessages.push({
                    role: 'user',
                    content: formattedContext
                });

                formattedMessages.push({
                    role: 'assistant',
                    content: PROVIDER_PROMPTS.ANTHROPIC.CONTEXT_QUERY_ACKNOWLEDGMENT
                });

                // Add any existing assistant messages if they exist
                const assistantMsgs = userAssistantMessages.filter(msg => msg.role === 'assistant');
                for (const msg of assistantMsgs) {
                    formattedMessages.push(msg);
                }
            }
        }
        // 2. If no explicit context but we have system messages, convert them to Claude format
        else if (messages.some(msg => msg.role === 'system')) {
            // Get system messages
            const systemMessages = messages.filter(msg => msg.role === 'system');

            // Build system content with XML tags
            const systemContent = PROVIDER_PROMPTS.ANTHROPIC.INSTRUCTIONS_WRAPPER(
                systemMessages.map(msg => this.cleanContextContent(msg.content)).join('\n\n')
            );

            // Add as first user message
            formattedMessages.push({
                role: 'user',
                content: systemContent
            });

            // Add assistant acknowledgment
            formattedMessages.push({
                role: 'assistant',
                content: PROVIDER_PROMPTS.ANTHROPIC.ACKNOWLEDGMENT
            });

            // Add remaining user/assistant messages
            for (const msg of userAssistantMessages) {
                formattedMessages.push(msg);
            }
        }
        // 3. Just a system prompt, no context
        else if (systemPrompt) {
            // Add as first user message with XML tags
            formattedMessages.push({
                role: 'user',
                content: PROVIDER_PROMPTS.ANTHROPIC.INSTRUCTIONS_WRAPPER(systemPrompt)
            });

            // Add assistant acknowledgment
            formattedMessages.push({
                role: 'assistant',
                content: PROVIDER_PROMPTS.ANTHROPIC.ACKNOWLEDGMENT
            });

            // Add all other messages
            for (const msg of userAssistantMessages) {
                formattedMessages.push(msg);
            }
        }
        // 4. No system prompt, use default from constants
        else if (userAssistantMessages.length > 0) {
            // Add default system prompt with XML tags
            formattedMessages.push({
                role: 'user',
                content: PROVIDER_PROMPTS.ANTHROPIC.INSTRUCTIONS_WRAPPER(this.getDefaultSystemPrompt())
            });

            // Add assistant acknowledgment
            formattedMessages.push({
                role: 'assistant',
                content: PROVIDER_PROMPTS.ANTHROPIC.ACKNOWLEDGMENT
            });

            // Add all user messages
            for (const msg of userAssistantMessages) {
                formattedMessages.push(msg);
            }
        }
        // 5. No special handling needed
        else {
            // Just add all messages as-is
            for (const msg of userAssistantMessages) {
                formattedMessages.push(msg);
            }
        }

        console.log(FORMATTER_LOGS.ANTHROPIC.PROCESSED(messages.length, formattedMessages.length));
        return formattedMessages;
    }

    /**
     * Clean context content for Anthropic
     * Claude works well with XML-structured content
     */
    cleanContextContent(content: string): string {
        if (!content) return '';

        try {
            // Convert HTML to a Claude-friendly format
            const cleaned = sanitizeHtml(content, {
                allowedTags: HTML_ALLOWED_TAGS.STANDARD,
                allowedAttributes: HTML_ALLOWED_ATTRIBUTES.STANDARD
            });

            // Convert to markdown but preserve some structure
            let markdown = cleaned;

            // Apply all standard HTML to Markdown patterns
            const patterns = HTML_TO_MARKDOWN_PATTERNS;
            for (const pattern of Object.values(patterns)) {
                markdown = markdown.replace(pattern.pattern, pattern.replacement);
            }

            // Process lists - use the parent class method
            markdown = this.processListItems(markdown);

            // Fix common HTML entities
            const entityPatterns = HTML_ENTITY_REPLACEMENTS;
            for (const pattern of Object.values(entityPatterns)) {
                markdown = markdown.replace(pattern.pattern, pattern.replacement);
            }

            return markdown.trim();
        } catch (error) {
            console.error(FORMATTER_LOGS.ERROR.CONTEXT_CLEANING("Anthropic"), error);
            return content; // Return original if cleaning fails
        }
    }

    /**
     * Get the maximum recommended context length for Anthropic
     */
    getMaxContextLength(): number {
        return AnthropicMessageFormatter.MAX_CONTEXT_LENGTH;
    }
}
