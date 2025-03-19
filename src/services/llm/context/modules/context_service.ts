import log from '../../../log.js';
import providerManager from './provider_manager.js';
import cacheManager from './cache_manager.js';
import semanticSearch from './semantic_search.js';
import queryEnhancer from './query_enhancer.js';
import contextFormatter from './context_formatter.js';
import aiServiceManager from '../../ai_service_manager.js';
import { ContextExtractor } from '../index.js';

/**
 * Main context service that integrates all context-related functionality
 * This service replaces the old TriliumContextService and SemanticContextService
 */
export class ContextService {
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private contextExtractor: ContextExtractor;

    constructor() {
        this.contextExtractor = new ContextExtractor();
    }

    /**
     * Initialize the service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        // Use a promise to prevent multiple simultaneous initializations
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                // Initialize provider
                const provider = await providerManager.getPreferredEmbeddingProvider();
                if (!provider) {
                    throw new Error(`No embedding provider available. Could not initialize context service.`);
                }

                // Initialize agent tools to ensure they're ready
                try {
                    await aiServiceManager.getInstance().initializeAgentTools();
                    log.info("Agent tools initialized for use with ContextService");
                } catch (toolError) {
                    log.error(`Error initializing agent tools: ${toolError}`);
                    // Continue even if agent tools fail to initialize
                }

                this.initialized = true;
                log.info(`Context service initialized with provider: ${provider.name}`);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`Failed to initialize context service: ${errorMessage}`);
                throw error;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    /**
     * Process a user query to find relevant context in Trilium notes
     *
     * @param userQuestion - The user's query
     * @param llmService - The LLM service to use
     * @param contextNoteId - Optional note ID to restrict search to a branch
     * @param showThinking - Whether to show the thinking process in output
     * @returns Context information and relevant notes
     */
    async processQuery(
        userQuestion: string,
        llmService: any,
        contextNoteId: string | null = null,
        showThinking: boolean = false
    ) {
        log.info(`Processing query with: question="${userQuestion.substring(0, 50)}...", noteId=${contextNoteId}, showThinking=${showThinking}`);

        if (!this.initialized) {
            try {
                await this.initialize();
            } catch (error) {
                log.error(`Failed to initialize ContextService: ${error}`);
                // Return a fallback response if initialization fails
                return {
                    context: "I am an AI assistant helping you with your Trilium notes. " +
                             "I'll try to assist you with general knowledge about your query.",
                    notes: [],
                    queries: [userQuestion]
                };
            }
        }

        try {
            // Step 1: Generate search queries
            let searchQueries: string[];
            try {
                searchQueries = await queryEnhancer.generateSearchQueries(userQuestion, llmService);
            } catch (error) {
                log.error(`Error generating search queries, using fallback: ${error}`);
                searchQueries = [userQuestion]; // Fallback to using the original question
            }
            log.info(`Generated search queries: ${JSON.stringify(searchQueries)}`);

            // Step 2: Find relevant notes using multi-query approach
            let relevantNotes: any[] = [];
            try {
                // Find notes for each query and combine results
                const allResults: Map<string, any> = new Map();

                for (const query of searchQueries) {
                    const results = await semanticSearch.findRelevantNotes(
                        query,
                        contextNoteId,
                        5 // Limit per query
                    );

                    // Combine results, avoiding duplicates
                    for (const result of results) {
                        if (!allResults.has(result.noteId)) {
                            allResults.set(result.noteId, result);
                        } else {
                            // If note already exists, update similarity to max of both values
                            const existing = allResults.get(result.noteId);
                            if (result.similarity > existing.similarity) {
                                existing.similarity = result.similarity;
                                allResults.set(result.noteId, existing);
                            }
                        }
                    }
                }

                // Convert map to array and limit to top results
                relevantNotes = Array.from(allResults.values())
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, 8); // Get top 8 notes
            } catch (error) {
                log.error(`Error finding relevant notes: ${error}`);
                // Continue with empty notes list
            }

            // Step 3: Build context from the notes
            const provider = await providerManager.getPreferredEmbeddingProvider();
            const providerId = provider?.name || 'default';
            const context = await contextFormatter.buildContextFromNotes(relevantNotes, userQuestion, providerId);

            // Step 4: Add agent tools context with thinking process if requested
            let enhancedContext = context;
            if (contextNoteId) {
                try {
                    const agentContext = await this.getAgentToolsContext(
                        contextNoteId,
                        userQuestion,
                        showThinking,
                        relevantNotes
                    );

                    if (agentContext) {
                        enhancedContext = enhancedContext + "\n\n" + agentContext;
                    }
                } catch (error) {
                    log.error(`Error getting agent tools context: ${error}`);
                    // Continue with the basic context
                }
            }

            return {
                context: enhancedContext,
                notes: relevantNotes,
                queries: searchQueries
            };
        } catch (error) {
            log.error(`Error processing query: ${error}`);
            return {
                context: "I am an AI assistant helping you with your Trilium notes. " +
                         "I'll try to assist you with general knowledge about your query.",
                notes: [],
                queries: [userQuestion]
            };
        }
    }

    /**
     * Get context with agent tools enhancement
     *
     * @param noteId - The relevant note ID
     * @param query - The user's query
     * @param showThinking - Whether to show thinking process
     * @param relevantNotes - Optional pre-found relevant notes
     * @returns Enhanced context string
     */
    async getAgentToolsContext(
        noteId: string,
        query: string,
        showThinking: boolean = false,
        relevantNotes: Array<any> = []
    ): Promise<string> {
        try {
            log.info(`Building enhanced agent tools context for query: "${query.substring(0, 50)}...", noteId=${noteId}, showThinking=${showThinking}`);

            // Make sure agent tools are initialized
            const agentManager = aiServiceManager.getInstance();

            // Initialize all tools if not already done
            if (!agentManager.getAgentTools().isInitialized()) {
                await agentManager.initializeAgentTools();
                log.info("Agent tools initialized on-demand in getAgentToolsContext");
            }

            // Get all agent tools
            const vectorSearchTool = agentManager.getVectorSearchTool();
            const noteNavigatorTool = agentManager.getNoteNavigatorTool();
            const queryDecompositionTool = agentManager.getQueryDecompositionTool();
            const contextualThinkingTool = agentManager.getContextualThinkingTool();

            // Step 1: Start a thinking process
            const thinkingId = contextualThinkingTool.startThinking(query);
            contextualThinkingTool.addThinkingStep(thinkingId, {
                type: 'observation',
                content: `Analyzing query: "${query}" for note ID: ${noteId}`
            });

            // Step 2: Decompose the query into sub-questions
            const decomposedQuery = queryDecompositionTool.decomposeQuery(query);
            contextualThinkingTool.addThinkingStep(thinkingId, {
                type: 'observation',
                content: `Query complexity: ${decomposedQuery.complexity}/10. Decomposed into ${decomposedQuery.subQueries.length} sub-queries.`
            });

            // Log each sub-query as a thinking step
            for (const subQuery of decomposedQuery.subQueries) {
                contextualThinkingTool.addThinkingStep(thinkingId, {
                    type: 'question',
                    content: subQuery.text,
                    metadata: {
                        reason: subQuery.reason
                    }
                });
            }

            // Step 3: Use vector search to find related content
            // Use an aggressive search with lower threshold to get more results
            const searchOptions = {
                threshold: 0.5,  // Lower threshold to include more matches
                limit: 15        // Get more results
            };

            const vectorSearchPromises = [];

            // Search for each sub-query that isn't just the original query
            for (const subQuery of decomposedQuery.subQueries.filter(sq => sq.text !== query)) {
                vectorSearchPromises.push(
                    vectorSearchTool.search(subQuery.text, noteId, searchOptions)
                        .then(results => {
                            return {
                                query: subQuery.text,
                                results
                            };
                        })
                );
            }

            // Wait for all searches to complete
            const searchResults = await Promise.all(vectorSearchPromises);

            // Record the search results in thinking steps
            let totalResults = 0;
            for (const result of searchResults) {
                totalResults += result.results.length;

                if (result.results.length > 0) {
                    const stepId = contextualThinkingTool.addThinkingStep(thinkingId, {
                        type: 'evidence',
                        content: `Found ${result.results.length} relevant notes for sub-query: "${result.query}"`,
                        metadata: {
                            searchQuery: result.query
                        }
                    });

                    // Add top results as children
                    for (const note of result.results.slice(0, 3)) {
                        contextualThinkingTool.addThinkingStep(thinkingId, {
                            type: 'evidence',
                            content: `Note "${note.title}" (similarity: ${Math.round(note.similarity * 100)}%) contains relevant information`,
                            metadata: {
                                noteId: note.noteId,
                                similarity: note.similarity
                            }
                        }, stepId);
                    }
                } else {
                    contextualThinkingTool.addThinkingStep(thinkingId, {
                        type: 'observation',
                        content: `No notes found for sub-query: "${result.query}"`,
                        metadata: {
                            searchQuery: result.query
                        }
                    });
                }
            }

            // Step 4: Get note structure information
            try {
                const noteStructure = await noteNavigatorTool.getNoteStructure(noteId);

                contextualThinkingTool.addThinkingStep(thinkingId, {
                    type: 'observation',
                    content: `Note structure: ${noteStructure.childCount} child notes, ${noteStructure.attributes.length} attributes, ${noteStructure.parentPath.length} levels in hierarchy`,
                    metadata: {
                        structure: noteStructure
                    }
                });

                // Add information about parent path
                if (noteStructure.parentPath.length > 0) {
                    const parentPathStr = noteStructure.parentPath.map((p: {title: string, noteId: string}) => p.title).join(' > ');
                    contextualThinkingTool.addThinkingStep(thinkingId, {
                        type: 'observation',
                        content: `Note hierarchy: ${parentPathStr}`,
                        metadata: {
                            parentPath: noteStructure.parentPath
                        }
                    });
                }
            } catch (error) {
                log.error(`Error getting note structure: ${error}`);
                contextualThinkingTool.addThinkingStep(thinkingId, {
                    type: 'observation',
                    content: `Unable to retrieve note structure information: ${error}`
                });
            }

            // Step 5: Conclude thinking process
            contextualThinkingTool.addThinkingStep(thinkingId, {
                type: 'conclusion',
                content: `Analysis complete. Found ${totalResults} relevant notes across ${searchResults.length} search queries.`,
                metadata: {
                    totalResults,
                    queryCount: searchResults.length
                }
            });

            // Complete the thinking process
            contextualThinkingTool.completeThinking(thinkingId);

            // Step 6: Build the context string combining all the information
            let agentContext = '';

            // Add note structure information
            try {
                const noteStructure = await noteNavigatorTool.getNoteStructure(noteId);
                agentContext += `## Current Note Context\n`;
                agentContext += `- Note Title: ${noteStructure.title}\n`;

                if (noteStructure.parentPath.length > 0) {
                    const parentPathStr = noteStructure.parentPath.map((p: {title: string, noteId: string}) => p.title).join(' > ');
                    agentContext += `- Location: ${parentPathStr}\n`;
                }

                if (noteStructure.attributes.length > 0) {
                    agentContext += `- Attributes: ${noteStructure.attributes.map((a: {name: string, value: string}) => `${a.name}=${a.value}`).join(', ')}\n`;
                }

                if (noteStructure.childCount > 0) {
                    agentContext += `- Contains ${noteStructure.childCount} child notes\n`;
                }

                agentContext += `\n`;
            } catch (error) {
                log.error(`Error adding note structure to context: ${error}`);
            }

            // Add most relevant notes from search results
            const allSearchResults = searchResults.flatMap(r => r.results);

            // Deduplicate results by noteId
            const uniqueResults = new Map();
            for (const result of allSearchResults) {
                if (!uniqueResults.has(result.noteId) || uniqueResults.get(result.noteId).similarity < result.similarity) {
                    uniqueResults.set(result.noteId, result);
                }
            }

            // Sort by similarity
            const sortedResults = Array.from(uniqueResults.values())
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, 10);  // Get top 10 unique results

            if (sortedResults.length > 0) {
                agentContext += `## Relevant Information\n`;

                for (const result of sortedResults) {
                    agentContext += `### ${result.title}\n`;

                    if (result.content) {
                        // Limit content to 500 chars per note to avoid token explosion
                        agentContext += `${result.content.substring(0, 500)}${result.content.length > 500 ? '...' : ''}\n\n`;
                    }
                }
            }

            // Add thinking process if requested
            if (showThinking) {
                agentContext += `\n## Reasoning Process\n`;
                agentContext += contextualThinkingTool.getThinkingSummary(thinkingId);
            }

            // Log stats about the context
            log.info(`Agent tools context built: ${agentContext.length} chars, ${agentContext.split('\n').length} lines`);

            return agentContext;
        } catch (error) {
            log.error(`Error getting agent tools context: ${error}`);
            return `Error generating enhanced context: ${error}`;
        }
    }

    /**
     * Get semantic context for a note and query
     *
     * @param noteId - The base note ID
     * @param userQuery - The user's query
     * @param maxResults - Maximum number of results to include
     * @returns Formatted context string
     */
    async getSemanticContext(noteId: string, userQuery: string, maxResults: number = 5): Promise<string> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Get related notes from the context extractor
            const [
                parentNotes,
                childNotes,
                linkedNotes
            ] = await Promise.all([
                this.contextExtractor.getParentNotes(noteId, 3),
                this.contextExtractor.getChildContext(noteId, 10).then(context => {
                    // Parse child notes from context string
                    const lines = context.split('\n');
                    const result: {noteId: string, title: string}[] = [];
                    for (const line of lines) {
                        const match = line.match(/- (.*)/);
                        if (match) {
                            // We don't have noteIds in the context string, so use titles only
                            result.push({
                                title: match[1],
                                noteId: '' // Empty noteId since we can't extract it from context
                            });
                        }
                    }
                    return result;
                }),
                this.contextExtractor.getLinkedNotesContext(noteId, 10).then(context => {
                    // Parse linked notes from context string
                    const lines = context.split('\n');
                    const result: {noteId: string, title: string}[] = [];
                    for (const line of lines) {
                        const match = line.match(/- \[(.*?)\]\(trilium:\/\/([a-zA-Z0-9]+)\)/);
                        if (match) {
                            result.push({
                                title: match[1],
                                noteId: match[2]
                            });
                        }
                    }
                    return result;
                })
            ]);

            // Combine all related notes
            const allRelatedNotes = [...parentNotes, ...childNotes, ...linkedNotes];

            // If no related notes, return empty context
            if (allRelatedNotes.length === 0) {
                return '';
            }

            // Convert parent notes from {id, title} to {noteId, title} for consistency
            const normalizedRelatedNotes = allRelatedNotes.map(note => {
                return {
                    noteId: 'id' in note ? note.id : note.noteId,
                    title: note.title
                };
            });

            // Rank notes by relevance to query
            const rankedNotes = await semanticSearch.rankNotesByRelevance(
                normalizedRelatedNotes as Array<{noteId: string, title: string}>,
                userQuery
            );

            // Get content for the top N most relevant notes
            const mostRelevantNotes = rankedNotes.slice(0, maxResults);
            const relevantContent = await Promise.all(
                mostRelevantNotes.map(async note => {
                    const content = await this.contextExtractor.getNoteContent(note.noteId);
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
        } catch (error) {
            log.error(`Error getting semantic context: ${error}`);
            return '';
        }
    }

    /**
     * Get progressive context loading based on depth
     *
     * @param noteId - The base note ID
     * @param depth - Depth level (1-4)
     * @returns Context string with progressively more information
     */
    async getProgressiveContext(noteId: string, depth: number = 1): Promise<string> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Use the existing context extractor method
            return await this.contextExtractor.getProgressiveContext(noteId, depth);
        } catch (error) {
            log.error(`Error getting progressive context: ${error}`);
            return '';
        }
    }

    /**
     * Get smart context that adapts to query complexity
     *
     * @param noteId - The base note ID
     * @param userQuery - The user's query
     * @returns Context string with appropriate level of detail
     */
    async getSmartContext(noteId: string, userQuery: string): Promise<string> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Determine query complexity to adjust context depth
            const complexity = queryEnhancer.estimateQueryComplexity(userQuery);

            // If it's a simple query with low complexity, use progressive context
            if (complexity < 0.3) {
                return await this.getProgressiveContext(noteId, 2); // Just note + parents
            }
            // For medium complexity, include more context
            else if (complexity < 0.7) {
                return await this.getProgressiveContext(noteId, 3); // Note + parents + children
            }
            // For complex queries, use semantic context
            else {
                return await this.getSemanticContext(noteId, userQuery, 7); // More results for complex queries
            }
        } catch (error) {
            log.error(`Error getting smart context: ${error}`);
            // Fallback to basic context extraction
            return await this.contextExtractor.extractContext(noteId);
        }
    }

    /**
     * Clear all context caches
     */
    clearCaches(): void {
        cacheManager.clearAllCaches();
    }
}

// Export singleton instance
export default new ContextService();
