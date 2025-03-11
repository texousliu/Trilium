import contextExtractor from './context_extractor.js';
import * as vectorStore from './embeddings/vector_store.js';
import sql from '../sql.js';
import { cosineSimilarity } from './embeddings/vector_store.js';
import log from '../log.js';
import { getEmbeddingProvider, getEnabledEmbeddingProviders } from './embeddings/providers.js';
import options from '../options.js';

/**
 * SEMANTIC CONTEXT SERVICE
 *
 * This service provides advanced context extraction capabilities for AI models.
 * It enhances the basic context extractor with vector embedding-based semantic
 * search and progressive context loading for large notes.
 *
 * === USAGE GUIDE ===
 *
 * 1. To use this service in other modules:
 *    ```
 *    import aiServiceManager from './services/llm/ai_service_manager.js';
 *    const semanticContext = aiServiceManager.getSemanticContextService();
 *    ```
 *
 *    Or with the instance directly:
 *    ```
 *    import aiServiceManager from './services/llm/ai_service_manager.js';
 *    const semanticContext = aiServiceManager.getInstance().getSemanticContextService();
 *    ```
 *
 * 2. Retrieve context based on semantic relevance to a query:
 *    ```
 *    const context = await semanticContext.getSemanticContext(noteId, userQuery);
 *    ```
 *
 * 3. Load context progressively (only what's needed):
 *    ```
 *    const context = await semanticContext.getProgressiveContext(noteId, depth);
 *    // depth: 1=just note, 2=+parents, 3=+children, 4=+linked notes
 *    ```
 *
 * 4. Use smart context selection that adapts to query complexity:
 *    ```
 *    const context = await semanticContext.getSmartContext(noteId, userQuery);
 *    ```
 *
 * === REQUIREMENTS ===
 *
 * - Requires at least one configured embedding provider (OpenAI, Anthropic, Ollama)
 * - Will fall back to non-semantic methods if no embedding provider is available
 * - Uses OpenAI embeddings by default if API key is configured
 */

/**
 * Provides advanced semantic context capabilities, enhancing the basic context extractor
 * with vector embedding-based semantic search and progressive context loading.
 *
 * This service is especially useful for retrieving the most relevant context from large
 * knowledge bases when working with limited-context LLMs.
 */
class SemanticContextService {
    /**
     * Get the preferred embedding provider based on user settings
     * Tries to use the most appropriate provider in this order:
     * 1. OpenAI if API key is set
     * 2. Anthropic if API key is set
     * 3. Ollama if configured
     * 4. Any available provider
     * 5. Local provider as fallback
     *
     * @returns The preferred embedding provider or null if none available
     */
    private async getPreferredEmbeddingProvider(): Promise<any> {
        // Try to get provider in order of preference
        const openaiKey = await options.getOption('openaiApiKey');
        if (openaiKey) {
            const provider = await getEmbeddingProvider('openai');
            if (provider) return provider;
        }

        const anthropicKey = await options.getOption('anthropicApiKey');
        if (anthropicKey) {
            const provider = await getEmbeddingProvider('anthropic');
            if (provider) return provider;
        }

        // If neither of the preferred providers is available, get any provider
        const providers = await getEnabledEmbeddingProviders();
        if (providers.length > 0) {
            return providers[0];
        }

        // Last resort is local provider
        return await getEmbeddingProvider('local');
    }

    /**
     * Generate embeddings for a text query
     *
     * @param query - The text query to embed
     * @returns The generated embedding or null if failed
     */
    private async generateQueryEmbedding(query: string): Promise<Float32Array | null> {
        try {
            // Get the preferred embedding provider
            const provider = await this.getPreferredEmbeddingProvider();
            if (!provider) {
                return null;
            }
            return await provider.generateEmbeddings(query);
        } catch (error) {
            log.error(`Error generating query embedding: ${error}`);
            return null;
        }
    }

    /**
     * Rank notes by semantic relevance to a query using vector similarity
     *
     * @param notes - Array of notes with noteId and title
     * @param userQuery - The user's query to compare against
     * @returns Sorted array of notes with relevance score
     */
    async rankNotesByRelevance(
        notes: Array<{noteId: string, title: string}>,
        userQuery: string
    ): Promise<Array<{noteId: string, title: string, relevance: number}>> {
        const queryEmbedding = await this.generateQueryEmbedding(userQuery);
        if (!queryEmbedding) {
            // If embedding fails, return notes in original order
            return notes.map(note => ({ ...note, relevance: 0 }));
        }

        const provider = await this.getPreferredEmbeddingProvider();
        if (!provider) {
            return notes.map(note => ({ ...note, relevance: 0 }));
        }

        const rankedNotes = [];

        for (const note of notes) {
            // Get note embedding from vector store or generate it if not exists
            let noteEmbedding = null;
            try {
                const embeddingResult = await vectorStore.getEmbeddingForNote(
                    note.noteId,
                    provider.name,
                    provider.getConfig().model || ''
                );

                if (embeddingResult) {
                    noteEmbedding = embeddingResult.embedding;
                }
            } catch (error) {
                log.error(`Error retrieving embedding for note ${note.noteId}: ${error}`);
            }

            if (!noteEmbedding) {
                // If note doesn't have an embedding yet, get content and generate one
                const content = await contextExtractor.getNoteContent(note.noteId);
                if (content && provider) {
                    try {
                        noteEmbedding = await provider.generateEmbeddings(content);
                        // Store the embedding for future use
                        await vectorStore.storeNoteEmbedding(
                            note.noteId,
                            provider.name,
                            provider.getConfig().model || '',
                            noteEmbedding
                        );
                    } catch (error) {
                        log.error(`Error generating embedding for note ${note.noteId}: ${error}`);
                    }
                }
            }

            let relevance = 0;
            if (noteEmbedding) {
                // Calculate cosine similarity between query and note
                relevance = cosineSimilarity(queryEmbedding, noteEmbedding);
            }

            rankedNotes.push({
                ...note,
                relevance
            });
        }

        // Sort by relevance (highest first)
        return rankedNotes.sort((a, b) => b.relevance - a.relevance);
    }

    /**
     * Retrieve semantic context based on relevance to user query
     * Finds the most semantically similar notes to the user's query
     *
     * @param noteId - Base note ID to start the search from
     * @param userQuery - Query to find relevant context for
     * @param maxResults - Maximum number of notes to include in context
     * @returns Formatted context with the most relevant notes
     */
    async getSemanticContext(noteId: string, userQuery: string, maxResults = 5): Promise<string> {
        // Get related notes (parents, children, linked notes)
        const [
            parentNotes,
            childNotes,
            linkedNotes
        ] = await Promise.all([
            this.getParentNotes(noteId, 3),
            this.getChildNotes(noteId, 10),
            this.getLinkedNotes(noteId, 10)
        ]);

        // Combine all related notes
        const allRelatedNotes = [...parentNotes, ...childNotes, ...linkedNotes];

        // If no related notes, return empty context
        if (allRelatedNotes.length === 0) {
            return '';
        }

        // Rank notes by relevance to query
        const rankedNotes = await this.rankNotesByRelevance(allRelatedNotes, userQuery);

        // Get content for the top N most relevant notes
        const mostRelevantNotes = rankedNotes.slice(0, maxResults);
        const relevantContent = await Promise.all(
            mostRelevantNotes.map(async note => {
                const content = await contextExtractor.getNoteContent(note.noteId);
                if (!content) return null;

                // Format with relevance score and title
                return `### ${note.title} (Relevance: ${Math.round(note.relevance * 100)}%)\n\n${content}`;
            })
        );

        // If no content retrieved, return empty string
        if (!relevantContent.filter(Boolean).length) {
            return '';
        }

        return `# Relevant Context\n\nThe following notes are most relevant to your query:\n\n${
            relevantContent.filter(Boolean).join('\n\n---\n\n')
        }`;
    }

    /**
     * Load context progressively based on depth level
     * This allows starting with minimal context and expanding as needed
     *
     * @param noteId - The ID of the note to get context for
     * @param depth - Depth level (1-4) determining how much context to include
     * @returns Context appropriate for the requested depth
     */
    async getProgressiveContext(noteId: string, depth = 1): Promise<string> {
        // Start with the note content
        const noteContent = await contextExtractor.getNoteContent(noteId);
        if (!noteContent) return 'Note not found';

        // If depth is 1, just return the note content
        if (depth <= 1) return noteContent;

        // Add parent context for depth >= 2
        const parentContext = await contextExtractor.getParentContext(noteId);
        if (depth <= 2) return `${parentContext}\n\n${noteContent}`;

        // Add child context for depth >= 3
        const childContext = await contextExtractor.getChildContext(noteId);
        if (depth <= 3) return `${parentContext}\n\n${noteContent}\n\n${childContext}`;

        // Add linked notes for depth >= 4
        const linkedContext = await contextExtractor.getLinkedNotesContext(noteId);
        return `${parentContext}\n\n${noteContent}\n\n${childContext}\n\n${linkedContext}`;
    }

    /**
     * Get parent notes in the hierarchy
     * Helper method that queries the database directly
     */
    private async getParentNotes(noteId: string, maxDepth: number): Promise<{noteId: string, title: string}[]> {
        const parentNotes: {noteId: string, title: string}[] = [];
        let currentNoteId = noteId;

        for (let i = 0; i < maxDepth; i++) {
            const parent = await sql.getRow<{parentNoteId: string, title: string}>(
                `SELECT branches.parentNoteId, notes.title
                 FROM branches
                 JOIN notes ON branches.parentNoteId = notes.noteId
                 WHERE branches.noteId = ? AND branches.isDeleted = 0 LIMIT 1`,
                [currentNoteId]
            );

            if (!parent || parent.parentNoteId === 'root') {
                break;
            }

            parentNotes.unshift({
                noteId: parent.parentNoteId,
                title: parent.title
            });

            currentNoteId = parent.parentNoteId;
        }

        return parentNotes;
    }

    /**
     * Get child notes
     * Helper method that queries the database directly
     */
    private async getChildNotes(noteId: string, maxChildren: number): Promise<{noteId: string, title: string}[]> {
        return await sql.getRows<{noteId: string, title: string}>(
            `SELECT noteId, title FROM notes
             WHERE parentNoteId = ? AND isDeleted = 0
             LIMIT ?`,
            [noteId, maxChildren]
        );
    }

    /**
     * Get linked notes
     * Helper method that queries the database directly
     */
    private async getLinkedNotes(noteId: string, maxLinks: number): Promise<{noteId: string, title: string}[]> {
        return await sql.getRows<{noteId: string, title: string}>(
            `SELECT noteId, title FROM notes
             WHERE noteId IN (
                SELECT value FROM attributes
                WHERE noteId = ? AND type = 'relation'
                LIMIT ?
             )`,
            [noteId, maxLinks]
        );
    }

    /**
     * Smart context selection that combines semantic matching with progressive loading
     * Returns the most appropriate context based on the query and available information
     *
     * @param noteId - The ID of the note to get context for
     * @param userQuery - The user's query for semantic relevance matching
     * @returns The optimal context for answering the query
     */
    async getSmartContext(noteId: string, userQuery: string): Promise<string> {
        // Check if embedding provider is available
        const provider = await this.getPreferredEmbeddingProvider();

        if (provider) {
            try {
                const semanticContext = await this.getSemanticContext(noteId, userQuery);
                if (semanticContext) {
                    return semanticContext;
                }
            } catch (error) {
                log.error(`Error getting semantic context: ${error}`);
                // Fall back to progressive context if semantic fails
            }
        }

        // Default to progressive context with appropriate depth based on query complexity
        // Simple queries get less context, complex ones get more
        const queryComplexity = this.estimateQueryComplexity(userQuery);
        const depth = Math.min(4, Math.max(1, queryComplexity));

        return this.getProgressiveContext(noteId, depth);
    }

    /**
     * Estimate query complexity to determine appropriate context depth
     *
     * @param query - The user's query string
     * @returns Complexity score from 1-4
     */
    private estimateQueryComplexity(query: string): number {
        if (!query) return 1;

        // Simple heuristics for query complexity:
        // 1. Length (longer queries tend to be more complex)
        // 2. Number of questions or specific requests
        // 3. Presence of complex terms/concepts

        const words = query.split(/\s+/).length;
        const questions = (query.match(/\?/g) || []).length;
        const comparisons = (query.match(/compare|difference|versus|vs\.|between/gi) || []).length;
        const complexity = (query.match(/explain|analyze|synthesize|evaluate|critique|recommend|suggest/gi) || []).length;

        // Calculate complexity score
        let score = 1;

        if (words > 20) score += 1;
        if (questions > 1) score += 1;
        if (comparisons > 0) score += 1;
        if (complexity > 0) score += 1;

        return Math.min(4, score);
    }
}

// Singleton instance
const semanticContextService = new SemanticContextService();
export default semanticContextService;
