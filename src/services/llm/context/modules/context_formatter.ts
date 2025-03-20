import sanitizeHtml from 'sanitize-html';
import log from '../../../log.js';
import { CONTEXT_PROMPTS } from '../../llm_prompt_constants.js';

// Constants for context window sizes, defines in-module to avoid circular dependencies
const CONTEXT_WINDOW = {
    OPENAI: 16000,
    ANTHROPIC: 100000,
    OLLAMA: 8000,
    DEFAULT: 4000
};

/**
 * Provides utilities for formatting context for LLM consumption
 */
export class ContextFormatter {
    /**
     * Build context string from retrieved notes
     *
     * @param sources - Array of notes or content sources
     * @param query - The original user query
     * @param providerId - The LLM provider to format for
     * @returns Formatted context string
     */
    async buildContextFromNotes(sources: any[], query: string, providerId: string = 'default'): Promise<string> {
        if (!sources || sources.length === 0) {
            // Return a default context from constants instead of empty string
            return CONTEXT_PROMPTS.NO_NOTES_CONTEXT;
        }

        try {
            // Get appropriate context size based on provider
            const maxTotalLength =
                providerId === 'openai' ? CONTEXT_WINDOW.OPENAI :
                providerId === 'anthropic' ? CONTEXT_WINDOW.ANTHROPIC :
                providerId === 'ollama' ? CONTEXT_WINDOW.OLLAMA :
                CONTEXT_WINDOW.DEFAULT;

            // Use a format appropriate for the model family
            const isAnthropicFormat = providerId === 'anthropic';

            // Start with different headers based on provider
            let context = isAnthropicFormat
                ? CONTEXT_PROMPTS.CONTEXT_HEADERS.ANTHROPIC(query)
                : CONTEXT_PROMPTS.CONTEXT_HEADERS.DEFAULT(query);

            // Sort sources by similarity if available to prioritize most relevant
            if (sources[0] && sources[0].similarity !== undefined) {
                sources = [...sources].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
            }

            // Track total size to avoid exceeding model context window
            let totalSize = context.length;
            const formattedSources: string[] = [];

            // Process each source
            for (const source of sources) {
                let content = '';
                if (typeof source === 'string') {
                    content = source;
                } else if (source.content) {
                    content = this.sanitizeNoteContent(source.content, source.type, source.mime);
                } else {
                    continue; // Skip invalid sources
                }

                if (!content || content.trim().length === 0) {
                    continue;
                }

                // Format source with title if available
                const title = source.title || 'Untitled Note';
                const noteId = source.noteId || '';
                const formattedSource = `### ${title}\n${content}\n`;

                // Check if adding this would exceed our size limit
                if (totalSize + formattedSource.length > maxTotalLength) {
                    // If this is the first source, include a truncated version
                    if (formattedSources.length === 0) {
                        const availableSpace = maxTotalLength - totalSize - 100; // Buffer for closing text
                        if (availableSpace > 200) { // Only if we have reasonable space
                            const truncatedContent = `### ${title}\n${content.substring(0, availableSpace)}...\n`;
                            formattedSources.push(truncatedContent);
                            totalSize += truncatedContent.length;
                        }
                    }
                    break;
                }

                formattedSources.push(formattedSource);
                totalSize += formattedSource.length;
            }

            // Add the formatted sources to the context
            context += formattedSources.join('\n');

            // Add closing to provide instructions to the AI
            const closing = isAnthropicFormat
                ? CONTEXT_PROMPTS.CONTEXT_CLOSINGS.ANTHROPIC
                : CONTEXT_PROMPTS.CONTEXT_CLOSINGS.DEFAULT;

            // Check if adding the closing would exceed our limit
            if (totalSize + closing.length <= maxTotalLength) {
                context += closing;
            }

            return context;
        } catch (error) {
            log.error(`Error building context from notes: ${error}`);
            return CONTEXT_PROMPTS.ERROR_FALLBACK_CONTEXT;
        }
    }

    /**
     * Sanitize note content for inclusion in context
     *
     * @param content - Raw note content
     * @param type - Note type (text, code, etc.)
     * @param mime - Note mime type
     * @returns Sanitized content
     */
    sanitizeNoteContent(content: string, type?: string, mime?: string): string {
        if (!content) {
            return '';
        }

        try {
            // If it's HTML content, sanitize it
            if (mime === 'text/html' || type === 'text') {
                // Use sanitize-html to convert HTML to plain text
                const sanitized = sanitizeHtml(content, {
                    allowedTags: [], // No tags allowed (strip all HTML)
                    allowedAttributes: {}, // No attributes allowed
                    textFilter: function(text) {
                        return text
                            .replace(/&nbsp;/g, ' ')
                            .replace(/\n\s*\n\s*\n/g, '\n\n'); // Replace multiple blank lines with just one
                    }
                });

                return sanitized.trim();
            }

            // If it's code, keep formatting but limit size
            if (type === 'code' || mime?.includes('application/')) {
                // For code, limit to a reasonable size
                if (content.length > 2000) {
                    return content.substring(0, 2000) + '...\n\n[Content truncated for brevity]';
                }
                return content;
            }

            // For all other types, just return as is
            return content;
        } catch (error) {
            log.error(`Error sanitizing note content: ${error}`);
            return content; // Return original content if sanitization fails
        }
    }
}

// Export singleton instance
export default new ContextFormatter();
