import type { Message } from '../ai_interface.js';
import { BaseMessageFormatter } from './base_formatter.js';
import sanitizeHtml from 'sanitize-html';
import { PROVIDER_PROMPTS, FORMATTING_PROMPTS } from '../constants/llm_prompt_constants.js';
import { LLM_CONSTANTS } from '../constants/provider_constants.js';
import {
    HTML_ALLOWED_TAGS,
    HTML_ALLOWED_ATTRIBUTES,
    OLLAMA_CLEANING,
    FORMATTER_LOGS
} from '../constants/formatter_constants.js';

/**
 * Ollama-specific message formatter
 * Handles the unique requirements of the Ollama API
 */
export class OllamaMessageFormatter extends BaseMessageFormatter {
    /**
     * Maximum recommended context length for Ollama
     * Smaller than other providers due to Ollama's handling of context
     */
    private static MAX_CONTEXT_LENGTH = LLM_CONSTANTS.CONTEXT_WINDOW.OLLAMA;

    /**
     * Format messages for the Ollama API
     * @param messages Messages to format
     * @param systemPrompt Optional system prompt to use
     * @param context Optional context to include
     * @param preserveSystemPrompt When true, preserves existing system messages rather than replacing them
     */
    formatMessages(messages: Message[], systemPrompt?: string, context?: string, preserveSystemPrompt?: boolean): Message[] {
        const formattedMessages: Message[] = [];

        // First identify user and system messages
        const systemMessages = messages.filter(msg => msg.role === 'system');
        const userMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');

        // Determine if we should preserve the existing system message
        if (preserveSystemPrompt && systemMessages.length > 0) {
            // Preserve the existing system message
            formattedMessages.push(systemMessages[0]);
        } else {
            // Use provided systemPrompt or default
            const basePrompt = systemPrompt || PROVIDER_PROMPTS.COMMON.DEFAULT_ASSISTANT_INTRO;
            formattedMessages.push({
                role: 'system',
                content: basePrompt
            });
        }

        // If we have context, inject it into the first user message
        if (context && userMessages.length > 0) {
            let injectedContext = false;

            for (let i = 0; i < userMessages.length; i++) {
                const msg = userMessages[i];

                if (msg.role === 'user' && !injectedContext) {
                    // Simple context injection directly in the user's message
                    const cleanedContext = this.cleanContextContent(context);

                    // DEBUG: Log the context before and after cleaning
                    console.log(`[OllamaFormatter] Context (first 500 chars): ${context.substring(0, 500).replace(/\n/g, '\\n')}...`);
                    console.log(`[OllamaFormatter] Cleaned context (first 500 chars): ${cleanedContext.substring(0, 500).replace(/\n/g, '\\n')}...`);

                    const formattedContext = PROVIDER_PROMPTS.OLLAMA.CONTEXT_INJECTION(
                        cleanedContext,
                        msg.content
                    );

                    // DEBUG: Log the final formatted context
                    console.log(`[OllamaFormatter] Formatted context (first 500 chars): ${formattedContext.substring(0, 500).replace(/\n/g, '\\n')}...`);

                    formattedMessages.push({
                        role: 'user',
                        content: formattedContext
                    });

                    injectedContext = true;
                } else {
                    formattedMessages.push(msg);
                }
            }
        } else {
            // No context, just add all messages as-is
            for (const msg of userMessages) {
                formattedMessages.push(msg);
            }
        }

        console.log(FORMATTER_LOGS.OLLAMA.PROCESSED(messages.length, formattedMessages.length));

        return formattedMessages;
    }

    /**
     * Clean up HTML and other problematic content before sending to Ollama
     * Ollama needs a more aggressive cleaning than other models,
     * but we want to preserve our XML tags for context
     */
    override cleanContextContent(content: string): string {
        if (!content) return '';

        try {
            // Store our XML tags so we can restore them after cleaning
            const noteTagsRegex = /<\/?note>/g;
            const notesTagsRegex = /<\/?notes>/g;
            const queryTagsRegex = /<\/?query>[^<]*<\/query>/g;

            // Capture tags to restore later
            const noteTags = content.match(noteTagsRegex) || [];
            const noteTagPositions: number[] = [];
            let match;
            const regex = /<\/?note>/g;
            while ((match = regex.exec(content)) !== null) {
                noteTagPositions.push(match.index);
            }

            // Remember the notes tags
            const notesTagsMatch = content.match(notesTagsRegex) || [];
            const notesTagPositions: number[] = [];
            while ((match = notesTagsRegex.exec(content)) !== null) {
                notesTagPositions.push(match.index);
            }

            // Remember the query tags
            const queryTagsMatch = content.match(queryTagsRegex) || [];

            // Temporarily replace XML tags with markers that won't be affected by sanitization
            let modified = content
                .replace(/<note>/g, '[NOTE_START]')
                .replace(/<\/note>/g, '[NOTE_END]')
                .replace(/<notes>/g, '[NOTES_START]')
                .replace(/<\/notes>/g, '[NOTES_END]')
                .replace(/<query>(.*?)<\/query>/g, '[QUERY]$1[/QUERY]');

            // First use the parent class to do standard cleaning
            let sanitized = super.cleanContextContent(modified);

            // Then apply Ollama-specific aggressive cleaning
            // Remove any remaining HTML using sanitizeHtml while keeping our markers
            let plaintext = sanitizeHtml(sanitized, {
                allowedTags: HTML_ALLOWED_TAGS.NONE,
                allowedAttributes: HTML_ALLOWED_ATTRIBUTES.NONE,
                textFilter: (text) => text
            });

            // Apply all Ollama-specific cleaning patterns
            const ollamaPatterns = OLLAMA_CLEANING;
            for (const pattern of Object.values(ollamaPatterns)) {
                plaintext = plaintext.replace(pattern.pattern, pattern.replacement);
            }

            // Restore our XML tags
            plaintext = plaintext
                .replace(/\[NOTE_START\]/g, '<note>')
                .replace(/\[NOTE_END\]/g, '</note>')
                .replace(/\[NOTES_START\]/g, '<notes>')
                .replace(/\[NOTES_END\]/g, '</notes>')
                .replace(/\[QUERY\](.*?)\[\/QUERY\]/g, '<query>$1</query>');

            return plaintext.trim();
        } catch (error) {
            console.error(FORMATTER_LOGS.ERROR.CONTEXT_CLEANING("Ollama"), error);
            return content; // Return original if cleaning fails
        }
    }

    /**
     * Get the maximum recommended context length for Ollama
     */
    getMaxContextLength(): number {
        return OllamaMessageFormatter.MAX_CONTEXT_LENGTH;
    }
}
