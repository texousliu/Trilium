import * as vectorStore from '../../embeddings/index.js';
import { cosineSimilarity } from '../../embeddings/index.js';
import log from '../../../log.js';
import becca from '../../../../becca/becca.js';
import providerManager from './provider_manager.js';
import cacheManager from './cache_manager.js';
import { ContextExtractor } from '../index.js';

/**
 * Provides semantic search capabilities for finding relevant notes
 */
export class SemanticSearch {
    private contextExtractor: ContextExtractor;

    constructor() {
        this.contextExtractor = new ContextExtractor();
    }

    /**
     * Rank notes by their semantic relevance to a query
     *
     * @param notes - Array of notes with noteId and title
     * @param userQuery - The user's query to compare against
     * @returns Sorted array of notes with relevance score
     */
    async rankNotesByRelevance(
        notes: Array<{noteId: string, title: string}>,
        userQuery: string
    ): Promise<Array<{noteId: string, title: string, relevance: number}>> {
        // Try to get from cache first
        const cacheKey = `rank:${userQuery}:${notes.map(n => n.noteId).join(',')}`;
        const cached = cacheManager.getNoteData('', cacheKey);
        if (cached) {
            return cached;
        }

        const queryEmbedding = await providerManager.generateQueryEmbedding(userQuery);
        if (!queryEmbedding) {
            // If embedding fails, return notes in original order
            return notes.map(note => ({ ...note, relevance: 0 }));
        }

        const provider = await providerManager.getPreferredEmbeddingProvider();
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
                const content = await this.contextExtractor.getNoteContent(note.noteId);
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
        const result = rankedNotes.sort((a, b) => b.relevance - a.relevance);

        // Cache results
        cacheManager.storeNoteData('', cacheKey, result);

        return result;
    }

    /**
     * Find notes that are semantically relevant to a query
     *
     * @param query - The search query
     * @param contextNoteId - Optional note ID to restrict search to a branch
     * @param limit - Maximum number of results to return
     * @returns Array of relevant notes with similarity scores
     */
    async findRelevantNotes(
        query: string,
        contextNoteId: string | null = null,
        limit = 10
    ): Promise<{noteId: string, title: string, content: string | null, similarity: number}[]> {
        try {
            // Check cache first
            const cacheKey = `find:${query}:${contextNoteId || 'all'}:${limit}`;
            const cached = cacheManager.getQueryResults(cacheKey);
            if (cached) {
                return cached;
            }

            // Get embedding for query
            const queryEmbedding = await providerManager.generateQueryEmbedding(query);
            if (!queryEmbedding) {
                log.error('Failed to generate query embedding');
                return [];
            }

            let results: {noteId: string, similarity: number}[] = [];

            // Get provider information
            const provider = await providerManager.getPreferredEmbeddingProvider();
            if (!provider) {
                log.error('No embedding provider available');
                return [];
            }

            // If contextNoteId is provided, search only within that branch
            if (contextNoteId) {
                results = await this.findNotesInBranch(queryEmbedding, contextNoteId, limit);
            } else {
                // Otherwise search across all notes with embeddings
                results = await vectorStore.findSimilarNotes(
                    queryEmbedding,
                    provider.name,
                    provider.getConfig().model || '',
                    limit
                );
            }

            // Get note details for results
            const enrichedResults = await Promise.all(
                results.map(async result => {
                    const note = becca.getNote(result.noteId);
                    if (!note) {
                        return null;
                    }

                    // Get note content
                    const content = await this.contextExtractor.getNoteContent(result.noteId);

                    return {
                        noteId: result.noteId,
                        title: note.title,
                        content,
                        similarity: result.similarity
                    };
                })
            );

            // Filter out null results
            const filteredResults = enrichedResults.filter(Boolean) as {
                noteId: string,
                title: string,
                content: string | null,
                similarity: number
            }[];

            // Cache results
            cacheManager.storeQueryResults(cacheKey, filteredResults);

            return filteredResults;
        } catch (error) {
            log.error(`Error finding relevant notes: ${error}`);
            return [];
        }
    }

    /**
     * Find notes in a specific branch (subtree) that are relevant to a query
     *
     * @param embedding - The query embedding
     * @param contextNoteId - Root note ID of the branch
     * @param limit - Maximum results to return
     * @returns Array of note IDs with similarity scores
     */
    private async findNotesInBranch(
        embedding: Float32Array,
        contextNoteId: string,
        limit = 5
    ): Promise<{noteId: string, similarity: number}[]> {
        try {
            // Get all notes in the subtree
            const noteIds = await this.getSubtreeNoteIds(contextNoteId);

            if (noteIds.length === 0) {
                return [];
            }

            // Get provider information
            const provider = await providerManager.getPreferredEmbeddingProvider();
            if (!provider) {
                log.error('No embedding provider available');
                return [];
            }

            // Get model configuration
            const model = provider.getConfig().model || '';
            const providerName = provider.name;

            // Check if vectorStore has the findSimilarNotesInSet method
            if (typeof vectorStore.findSimilarNotesInSet === 'function') {
                // Use the dedicated method if available
                return await vectorStore.findSimilarNotesInSet(
                    embedding,
                    noteIds,
                    providerName,
                    model,
                    limit
                );
            }

            // Fallback: Manually search through the notes in the subtree
            const similarities: {noteId: string, similarity: number}[] = [];

            for (const noteId of noteIds) {
                try {
                    const noteEmbedding = await vectorStore.getEmbeddingForNote(
                        noteId,
                        providerName,
                        model
                    );

                    if (noteEmbedding && noteEmbedding.embedding) {
                        const similarity = cosineSimilarity(embedding, noteEmbedding.embedding);
                        if (similarity > 0.5) { // Apply a similarity threshold
                            similarities.push({
                                noteId,
                                similarity
                            });
                        }
                    }
                } catch (error) {
                    // Skip notes that don't have embeddings
                    continue;
                }
            }

            // Sort by similarity and return top results
            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);
        } catch (error) {
            log.error(`Error finding notes in branch: ${error}`);
            return [];
        }
    }

    /**
     * Get all note IDs in a subtree
     *
     * @param rootNoteId - The root note ID
     * @returns Array of note IDs in the subtree
     */
    private async getSubtreeNoteIds(rootNoteId: string): Promise<string[]> {
        const noteIds = new Set<string>();
        noteIds.add(rootNoteId); // Include the root note itself

        const collectChildNotes = (noteId: string) => {
            const note = becca.getNote(noteId);
            if (!note) {
                return;
            }

            const childNotes = note.getChildNotes();
            for (const childNote of childNotes) {
                if (!noteIds.has(childNote.noteId)) {
                    noteIds.add(childNote.noteId);
                    collectChildNotes(childNote.noteId);
                }
            }
        };

        collectChildNotes(rootNoteId);
        return Array.from(noteIds);
    }
}

// Export singleton instance
export default new SemanticSearch();
