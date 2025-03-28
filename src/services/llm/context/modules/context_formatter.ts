import sanitizeHtml from 'sanitize-html';
import log from '../../../log.js';
import { CONTEXT_PROMPTS } from '../../constants/llm_prompt_constants.js';
import type { IContextFormatter, NoteSearchResult } from '../../interfaces/context_interfaces.js';

// Constants for context window sizes, defines in-module to avoid circular dependencies
const CONTEXT_WINDOW = {
    OPENAI: 16000,
    ANTHROPIC: 100000,
    OLLAMA: 8000,
    DEFAULT: 4000
};

/**
 * Formats context data for LLM consumption
 *
 * This service is responsible for formatting note data into a structured
 * format that can be efficiently processed by the LLM.
 */
export class ContextFormatter implements IContextFormatter {
    /**
     * Build a structured context string from note sources
     *
     * @param sources Array of note data with content and metadata
     * @param query The user's query for context
     * @param providerId Optional provider ID to customize formatting
     * @returns Formatted context string
     */
    async buildContextFromNotes(sources: NoteSearchResult[], query: string, providerId: string = 'default'): Promise<string> {
        if (!sources || sources.length === 0) {
            log.info('No sources provided to context formatter');
            return CONTEXT_PROMPTS.NO_NOTES_CONTEXT;
        }

        try {
            // Get appropriate context size based on provider
            const maxTotalLength =
                providerId === 'openai' ? CONTEXT_WINDOW.OPENAI :
                providerId === 'anthropic' ? CONTEXT_WINDOW.ANTHROPIC :
                providerId === 'ollama' ? CONTEXT_WINDOW.OLLAMA :
                CONTEXT_WINDOW.DEFAULT;

            // DEBUG: Log context window size
            log.info(`Context window for provider ${providerId}: ${maxTotalLength} chars`);
            log.info(`Formatting context from ${sources.length} sources for query: "${query.substring(0, 50)}..."`);

            // Use a format appropriate for the model family
            const isAnthropicFormat = providerId === 'anthropic';

            // Start with different headers based on provider
            let formattedContext = isAnthropicFormat
                ? CONTEXT_PROMPTS.CONTEXT_HEADERS.ANTHROPIC(query)
                : CONTEXT_PROMPTS.CONTEXT_HEADERS.DEFAULT(query);

            // Sort sources by similarity if available to prioritize most relevant
            if (sources[0] && sources[0].similarity !== undefined) {
                sources = [...sources].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
                // DEBUG: Log sorting information
                log.info(`Sources sorted by similarity. Top sources: ${sources.slice(0, 3).map(s => s.title || 'Untitled').join(', ')}`);
            }

            // Track total size to avoid exceeding model context window
            let totalSize = formattedContext.length;
            const formattedSources: string[] = [];

            // DEBUG: Track stats for logging
            let sourcesProcessed = 0;
            let sourcesIncluded = 0;
            let sourcesSkipped = 0;
            let sourcesExceededLimit = 0;

            // Process each source
            for (const source of sources) {
                sourcesProcessed++;
                let content = '';
                if (typeof source === 'string') {
                    content = source;
                } else if (source.content) {
                    content = this.sanitizeNoteContent(source.content, source.type, source.mime);
                } else {
                    sourcesSkipped++;
                    log.info(`Skipping note with no content: ${source.title || 'Untitled'}`);
                    continue; // Skip invalid sources
                }

                // Skip if content is empty or just whitespace/minimal
                if (!content || content.trim().length <= 10) {
                    sourcesSkipped++;
                    log.info(`Skipping note with minimal content: ${source.title || 'Untitled'}`);
                    continue;
                }

                // Format source with title if available
                const title = source.title || 'Untitled Note';
                const noteId = source.noteId || '';
                const formattedSource = `### ${title}\n${content}\n`;

                // Check if adding this would exceed our size limit
                if (totalSize + formattedSource.length > maxTotalLength) {
                    sourcesExceededLimit++;
                    // If this is the first source, include a truncated version
                    if (formattedSources.length === 0) {
                        const availableSpace = maxTotalLength - totalSize - 100; // Buffer for closing text
                        if (availableSpace > 200) { // Only if we have reasonable space
                            const truncatedContent = `### ${title}\n${content.substring(0, availableSpace)}...\n`;
                            formattedSources.push(truncatedContent);
                            totalSize += truncatedContent.length;
                            sourcesIncluded++;
                            // DEBUG: Log truncation
                            log.info(`Truncated first source "${title}" to fit in context window. Used ${truncatedContent.length} of ${formattedSource.length} chars`);
                        }
                    }
                    break;
                }

                formattedSources.push(formattedSource);
                totalSize += formattedSource.length;
                sourcesIncluded++;
            }

            // DEBUG: Log sources stats
            log.info(`Context building stats: processed ${sourcesProcessed}/${sources.length} sources, included ${sourcesIncluded}, skipped ${sourcesSkipped}, exceeded limit ${sourcesExceededLimit}`);
            log.info(`Context size so far: ${totalSize}/${maxTotalLength} chars (${(totalSize/maxTotalLength*100).toFixed(2)}% of limit)`);

            // Add the formatted sources to the context
            formattedContext += formattedSources.join('\n');

            // Add closing to provide instructions to the AI
            const closing = isAnthropicFormat
                ? CONTEXT_PROMPTS.CONTEXT_CLOSINGS.ANTHROPIC
                : CONTEXT_PROMPTS.CONTEXT_CLOSINGS.DEFAULT;

            // Check if adding the closing would exceed our limit
            if (totalSize + closing.length <= maxTotalLength) {
                formattedContext += closing;
            }

            // DEBUG: Log final context size
            log.info(`Final context: ${formattedContext.length} chars, ${formattedSources.length} sources included`);

            return formattedContext;
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
