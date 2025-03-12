/**
 * Context extraction module for LLM features
 * Provides methods to extract relevant context from notes for LLM processing
 */

import becca from '../../../becca/becca.js';
import { getNoteContent, formatNoteContent, sanitizeHtmlContent } from './note_content.js';
import { detectLanguage, extractCodeStructure } from './code_handlers.js';
import { chunkContent, semanticChunking } from './content_chunking.js';
import type { ContentChunk, ChunkOptions } from './content_chunking.js';
import { summarizeContent, extractKeyPoints } from './summarization.js';
import { getParentNotes, getParentContext, getChildContext, getLinkedNotesContext } from './hierarchy.js';
import { getSemanticContext } from './semantic_context.js';

/**
 * Options for context extraction
 */
export interface ContextOptions {
    /**
     * Include parent context
     */
    includeParents?: boolean;

    /**
     * Include child notes in context
     */
    includeChildren?: boolean;

    /**
     * Include linked notes in context
     */
    includeLinks?: boolean;

    /**
     * Include semantically similar notes
     */
    includeSimilar?: boolean;

    /**
     * Include note content in context
     */
    includeContent?: boolean;

    /**
     * Maximum depth for parent hierarchy
     */
    maxParentDepth?: number;

    /**
     * Maximum number of children to include
     */
    maxChildren?: number;

    /**
     * Maximum number of linked notes to include
     */
    maxLinks?: number;

    /**
     * Maximum number of similar notes to include
     */
    maxSimilarNotes?: number;

    /**
     * Maximum content length
     */
    maxContentLength?: number;
}

/**
 * Default options for context extraction
 */
const DEFAULT_CONTEXT_OPTIONS: Required<ContextOptions> = {
    includeParents: true,
    includeChildren: true,
    includeLinks: true,
    includeSimilar: false,
    includeContent: true,
    maxParentDepth: 3,
    maxChildren: 10,
    maxLinks: 10,
    maxSimilarNotes: 5,
    maxContentLength: 2000
};

/**
 * Context Extractor class
 * Handles extraction of context from notes for LLM processing
 */
export class ContextExtractor {
    /**
     * Get content of a note
     */
    static async getNoteContent(noteId: string): Promise<string | null> {
        return getNoteContent(noteId);
    }

    /**
     * Get content of a note - instance method
     */
    async getNoteContent(noteId: string): Promise<string | null> {
        return ContextExtractor.getNoteContent(noteId);
    }

    /**
     * Format note content based on its type
     */
    static formatNoteContent(content: string, type: string, mime: string, title: string): string {
        return formatNoteContent(content, type, mime, title);
    }

    /**
     * Format note content based on its type - instance method
     */
    formatNoteContent(content: string, type: string, mime: string, title: string): string {
        return ContextExtractor.formatNoteContent(content, type, mime, title);
    }

    /**
     * Sanitize HTML content to plain text
     */
    static sanitizeHtmlContent(html: string): string {
        return sanitizeHtmlContent(html);
    }

    /**
     * Sanitize HTML content to plain text - instance method
     */
    sanitizeHtmlContent(html: string): string {
        return ContextExtractor.sanitizeHtmlContent(html);
    }

    /**
     * Detect programming language from content
     */
    static detectLanguage(content: string, mime: string): string {
        return detectLanguage(content, mime);
    }

    /**
     * Detect programming language from content - instance method
     */
    detectLanguage(content: string, mime: string): string {
        return ContextExtractor.detectLanguage(content, mime);
    }

    /**
     * Extract structure from code
     */
    static extractCodeStructure(content: string, language: string): string {
        return extractCodeStructure(content, language);
    }

    /**
     * Extract structure from code - instance method
     */
    extractCodeStructure(content: string, language: string): string {
        return ContextExtractor.extractCodeStructure(content, language);
    }

    /**
     * Chunk content into smaller pieces
     */
    static async chunkContent(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return chunkContent(content, title, noteId, options);
    }

    /**
     * Chunk content into smaller pieces - instance method
     */
    async chunkContent(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return ContextExtractor.chunkContent(content, title, noteId, options);
    }

    /**
     * Smarter chunking that respects semantic boundaries
     */
    static async semanticChunking(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return semanticChunking(content, title, noteId, options);
    }

    /**
     * Smarter chunking that respects semantic boundaries - instance method
     */
    async semanticChunking(
        content: string,
        title: string = '',
        noteId: string = '',
        options: ChunkOptions = {}
    ): Promise<ContentChunk[]> {
        return ContextExtractor.semanticChunking(content, title, noteId, options);
    }

    /**
     * Summarize content
     */
    static summarizeContent(
        content: string,
        title: string = ''
    ): string {
        return summarizeContent(content, title);
    }

    /**
     * Summarize content - instance method
     */
    summarizeContent(
        content: string,
        title: string = ''
    ): string {
        return ContextExtractor.summarizeContent(content, title);
    }

    /**
     * Extract key points from content
     */
    static extractKeyPoints(
        content: string,
        maxPoints: number = 5
    ): string[] {
        return extractKeyPoints(content, maxPoints);
    }

    /**
     * Extract key points from content - instance method
     */
    extractKeyPoints(
        content: string,
        maxPoints: number = 5
    ): string[] {
        return ContextExtractor.extractKeyPoints(content, maxPoints);
    }

    /**
     * Get parent notes
     */
    static async getParentNotes(
        noteId: string,
        maxParents: number = 5
    ): Promise<{id: string, title: string}[]> {
        return getParentNotes(noteId, maxParents);
    }

    /**
     * Get parent notes - instance method
     */
    async getParentNotes(
        noteId: string,
        maxParents: number = 5
    ): Promise<{id: string, title: string}[]> {
        return ContextExtractor.getParentNotes(noteId, maxParents);
    }

    /**
     * Get hierarchical parent context
     */
    static async getParentContext(
        noteId: string,
        maxDepth: number = 3,
        maxParents: number = 3
    ): Promise<string> {
        return getParentContext(noteId, maxDepth, maxParents);
    }

    /**
     * Get hierarchical parent context - instance method
     */
    async getParentContext(
        noteId: string,
        maxDepth: number = 3,
        maxParents: number = 3
    ): Promise<string> {
        return ContextExtractor.getParentContext(noteId, maxDepth, maxParents);
    }

    /**
     * Get child context
     */
    static async getChildContext(
        noteId: string,
        maxChildren: number = 10,
        includeContent: boolean = false
    ): Promise<string> {
        return getChildContext(noteId, maxChildren, includeContent);
    }

    /**
     * Get child context - instance method
     */
    async getChildContext(
        noteId: string,
        maxChildren: number = 10,
        includeContent: boolean = false
    ): Promise<string> {
        return ContextExtractor.getChildContext(noteId, maxChildren, includeContent);
    }

    /**
     * Get linked notes context
     */
    static async getLinkedNotesContext(
        noteId: string,
        maxRelations: number = 10
    ): Promise<string> {
        return getLinkedNotesContext(noteId, maxRelations);
    }

    /**
     * Get linked notes context - instance method
     */
    async getLinkedNotesContext(
        noteId: string,
        maxRelations: number = 10
    ): Promise<string> {
        return ContextExtractor.getLinkedNotesContext(noteId, maxRelations);
    }

    /**
     * Get semantic context
     */
    static async getSemanticContext(
        noteId: string,
        maxSimilarNotesOrQuery: number | string = 5
    ): Promise<string> {
        // Handle both the new (number) and old (string query) parameter types
        if (typeof maxSimilarNotesOrQuery === 'string') {
            // Old API: The second parameter was a query string
            // For backward compatibility, we'll still accept this
            return getSemanticContext(noteId, { maxSimilarNotes: 5 });
        } else {
            // New API: The second parameter is maxSimilarNotes
            return getSemanticContext(noteId, { maxSimilarNotes: maxSimilarNotesOrQuery });
        }
    }

    /**
     * Get semantic context - instance method
     */
    async getSemanticContext(
        noteId: string,
        maxSimilarNotesOrQuery: number | string = 5
    ): Promise<string> {
        return ContextExtractor.getSemanticContext(noteId, maxSimilarNotesOrQuery);
    }

    /**
     * Extract full context for a note
     * This combines various context sources based on provided options
     */
    static async extractContext(
        noteId: string,
        options: ContextOptions = {}
    ): Promise<string> {
        const config: Required<ContextOptions> = { ...DEFAULT_CONTEXT_OPTIONS, ...options };
        const note = becca.getNote(noteId);

        if (!note) {
            return "Note not found.";
        }

        let context = `# Context for note: ${note.title}\n\n`;

        // Include parent context
        if (config.includeParents) {
            const parentContext = await ContextExtractor.getParentContext(
                noteId,
                config.maxParentDepth,
                3 // Default to 3 parents per level
            );

            if (parentContext) {
                context += `## Parent Hierarchy\n${parentContext}\n\n`;
            }
        }

        // Include note content
        if (config.includeContent) {
            const content = await ContextExtractor.getNoteContent(noteId);

            if (content) {
                // If content is too large, summarize it
                let contentSection = '';

                if (content.length > config.maxContentLength) {
                    contentSection = ContextExtractor.summarizeContent(content, note.title);
                    contentSection += "\n\n[Content summarized due to length]";
                } else {
                    contentSection = content;
                }

                context += `## Note Content\n${contentSection}\n\n`;
            }
        }

        // Include child context
        if (config.includeChildren) {
            const childContext = await ContextExtractor.getChildContext(
                noteId,
                config.maxChildren,
                false // Don't include child content by default
            );

            if (childContext && childContext !== "No child notes.") {
                context += `## Child Notes\n${childContext}\n\n`;
            }
        }

        // Include linked notes
        if (config.includeLinks) {
            const linkedContext = await ContextExtractor.getLinkedNotesContext(
                noteId,
                config.maxLinks
            );

            if (linkedContext && linkedContext !== "No linked notes.") {
                context += `## Linked Notes\n${linkedContext}\n\n`;
            }
        }

        // Include semantically similar notes
        if (config.includeSimilar) {
            const semanticContext = await ContextExtractor.getSemanticContext(
                noteId,
                config.maxSimilarNotes
            );

            if (semanticContext && !semanticContext.includes("No semantically similar notes found.")) {
                context += `## Similar Notes\n${semanticContext}\n\n`;
            }
        }

        return context;
    }

    /**
     * Extract full context for a note - instance method
     */
    async extractContext(
        noteId: string,
        options: ContextOptions = {}
    ): Promise<string> {
        return ContextExtractor.extractContext(noteId, options);
    }

    /**
     * Get progressively loaded context based on depth level
     * This provides different levels of context detail depending on the depth parameter
     *
     * @param noteId - The ID of the note to get context for
     * @param depth - Depth level (1-4) determining how much context to include
     * @returns Context appropriate for the requested depth
     */
    static async getProgressiveContext(noteId: string, depth = 1): Promise<string> {
        try {
            // This requires the semantic context service to be available
            // We're using a dynamic import to avoid circular dependencies
            const { default: aiServiceManager } = await import('../ai_service_manager.js');
            const semanticContext = aiServiceManager.getInstance().getSemanticContextService();

            if (!semanticContext) {
                return ContextExtractor.extractContext(noteId);
            }

            return await semanticContext.getProgressiveContext(noteId, depth);
        } catch (error) {
            // Fall back to regular context if progressive loading fails
            console.error('Error in progressive context loading:', error);
            return ContextExtractor.extractContext(noteId);
        }
    }

    /**
     * Get progressively loaded context based on depth level - instance method
     */
    async getProgressiveContext(noteId: string, depth = 1): Promise<string> {
        return ContextExtractor.getProgressiveContext(noteId, depth);
    }

    /**
     * Get smart context based on the query complexity
     * This automatically selects the appropriate context depth and relevance
     *
     * @param noteId - The ID of the note to get context for
     * @param query - The user's query for semantic relevance matching
     * @returns The optimal context for answering the query
     */
    static async getSmartContext(noteId: string, query: string): Promise<string> {
        try {
            // This requires the semantic context service to be available
            // We're using a dynamic import to avoid circular dependencies
            const { default: aiServiceManager } = await import('../ai_service_manager.js');
            const semanticContext = aiServiceManager.getInstance().getSemanticContextService();

            if (!semanticContext) {
                return ContextExtractor.extractContext(noteId);
            }

            return await semanticContext.getSmartContext(noteId, query);
        } catch (error) {
            // Fall back to regular context if smart context fails
            console.error('Error in smart context selection:', error);
            return ContextExtractor.extractContext(noteId);
        }
    }

    /**
     * Get smart context based on the query complexity - instance method
     */
    async getSmartContext(noteId: string, query: string): Promise<string> {
        return ContextExtractor.getSmartContext(noteId, query);
    }

    /**
     * Get the full context for a note, including parent hierarchy, content, and children
     * Legacy method for backwards compatibility
     */
    static async getFullContext(noteId: string): Promise<string> {
        // Use extractContext with default options
        return ContextExtractor.extractContext(noteId);
    }

    /**
     * Get the full context for a note - instance method
     */
    async getFullContext(noteId: string): Promise<string> {
        return ContextExtractor.getFullContext(noteId);
    }

    /**
     * Get note summary - for backward compatibility
     */
    static async getNoteSummary(noteId: string, maxLength = 5000): Promise<string> {
        const note = becca.getNote(noteId);
        if (!note) return '';

        const content = await getNoteContent(noteId);
        if (!content || content.length < maxLength) return content || '';

        // For larger content, generate a summary
        return summarizeContent(content, note.title);
    }

    /**
     * Get note summary - instance method
     */
    async getNoteSummary(noteId: string, maxLength = 5000): Promise<string> {
        return ContextExtractor.getNoteSummary(noteId, maxLength);
    }

    /**
     * Split a large note into smaller, semantically meaningful chunks
     * This is useful for handling large notes that exceed the context window of LLMs
     * For backward compatibility
     */
    static async getChunkedNoteContent(noteId: string, maxChunkSize = 2000): Promise<string[]> {
        const content = await getNoteContent(noteId);
        if (!content) return [];

        // Use the new chunking functionality
        const chunks = await ContextExtractor.chunkContent(
            content,
            '',
            noteId,
            { maxChunkSize, respectBoundaries: true }
        );

        // Convert to the old API format which was an array of strings
        return (await chunks).map(chunk => chunk.content);
    }

    /**
     * Split a large note into smaller chunks - instance method
     */
    async getChunkedNoteContent(noteId: string, maxChunkSize = 2000): Promise<string[]> {
        return ContextExtractor.getChunkedNoteContent(noteId, maxChunkSize);
    }
}

// Export all modules
export {
    getNoteContent,
    formatNoteContent,
    sanitizeHtmlContent,
    detectLanguage,
    extractCodeStructure,
    chunkContent,
    semanticChunking,
    summarizeContent,
    extractKeyPoints,
    getParentNotes,
    getParentContext,
    getChildContext,
    getLinkedNotesContext,
    getSemanticContext
};

// Export types
export type {
    ContentChunk,
    ChunkOptions
};
