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
            return await aiServiceManager.getInstance().getAgentToolsContext(
                noteId,
                query,
                showThinking,
                relevantNotes
            );
        } catch (error) {
            log.error(`Error getting agent tools context: ${error}`);
            return '';
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

            // Rank notes by relevance to query
            const rankedNotes = await semanticSearch.rankNotesByRelevance(allRelatedNotes, userQuery);

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
