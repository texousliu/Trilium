import becca from "../../becca/becca.js";
import vectorStore from "./embeddings/index.js";
import providerManager from "./embeddings/providers.js";
import options from "../options.js";
import log from "../log.js";
import type { Message } from "./ai_interface.js";
import { cosineSimilarity } from "./embeddings/index.js";
import sanitizeHtml from "sanitize-html";

/**
 * TriliumContextService provides intelligent context management for working with large knowledge bases
 * through limited context window LLMs like Ollama.
 *
 * It creates a "meta-prompting" approach where the first LLM call is used
 * to determine what information might be needed to answer the query,
 * then only the relevant context is loaded, before making the final
 * response.
 */
class TriliumContextService {
    private initialized = false;
    private initPromise: Promise<void> | null = null;
    private provider: any = null;

    // Cache for recently used context to avoid repeated embedding lookups
    private recentQueriesCache = new Map<string, {
        timestamp: number,
        relevantNotes: any[]
    }>();

    // Configuration
    private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
    private metaPrompt = `You are an AI assistant that decides what information needs to be retrieved from a user's knowledge base called TriliumNext Notes to answer the user's question.
Given the user's question, generate 3-5 specific search queries that would help find relevant information.
Each query should be focused on a different aspect of the question.
Format your answer as a JSON array of strings, with each string being a search query.
Example: ["exact topic mentioned", "related concept 1", "related concept 2"]`;

    constructor() {
        this.setupCacheCleanup();
    }

    /**
     * Initialize the service
     */
    async initialize() {
        if (this.initialized) return;

        // Use a promise to prevent multiple simultaneous initializations
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                // Get user's configured provider or fallback to ollama
                const providerId = await options.getOption('embeddingsDefaultProvider') || 'ollama';
                this.provider = providerManager.getEmbeddingProvider(providerId);

                // If specified provider not found, try ollama as first fallback for self-hosted usage
                if (!this.provider && providerId !== 'ollama') {
                    log.info(`Embedding provider ${providerId} not found, trying ollama as fallback`);
                    this.provider = providerManager.getEmbeddingProvider('ollama');
                }

                // If ollama not found, try openai as a second fallback
                if (!this.provider && providerId !== 'openai') {
                    log.info(`Embedding provider ollama not found, trying openai as fallback`);
                    this.provider = providerManager.getEmbeddingProvider('openai');
                }

                // Final fallback to local provider which should always exist
                if (!this.provider) {
                    log.info(`No embedding provider found, falling back to local provider`);
                    this.provider = providerManager.getEmbeddingProvider('local');
                }

                if (!this.provider) {
                    throw new Error(`No embedding provider available. Could not initialize context service.`);
                }

                this.initialized = true;
                log.info(`Trilium context service initialized with provider: ${this.provider.name}`);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`Failed to initialize Trilium context service: ${errorMessage}`);
                throw error;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    /**
     * Set up periodic cache cleanup
     */
    private setupCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.recentQueriesCache.entries()) {
                if (now - data.timestamp > this.cacheExpiryMs) {
                    this.recentQueriesCache.delete(key);
                }
            }
        }, 60000); // Run cleanup every minute
    }

    /**
     * Generate search queries to find relevant information for the user question
     * @param userQuestion - The user's question
     * @param llmService - The LLM service to use for generating queries
     * @returns Array of search queries
     */
    async generateSearchQueries(userQuestion: string, llmService: any): Promise<string[]> {
        try {
            const messages: Message[] = [
                { role: "system", content: this.metaPrompt },
                { role: "user", content: userQuestion }
            ];

            const options = {
                temperature: 0.3,
                maxTokens: 300
            };

            // Get the response from the LLM using the correct method name
            const response = await llmService.generateChatCompletion(messages, options);
            const responseText = response.text; // Extract the text from the response object

            try {
                // Remove code blocks, quotes, and clean up the response text
                let jsonStr = responseText
                    .replace(/```(?:json)?|```/g, '') // Remove code block markers
                    .replace(/[\u201C\u201D]/g, '"')  // Replace smart quotes with straight quotes
                    .trim();

                // Check if the text might contain a JSON array (has square brackets)
                if (jsonStr.includes('[') && jsonStr.includes(']')) {
                    // Extract just the array part if there's explanatory text
                    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
                    if (arrayMatch) {
                        jsonStr = arrayMatch[0];
                    }

                    // Try to parse the JSON
                    try {
                        const queries = JSON.parse(jsonStr);
                        if (Array.isArray(queries) && queries.length > 0) {
                            return queries.map(q => typeof q === 'string' ? q : String(q)).filter(Boolean);
                        }
                    } catch (innerError) {
                        // If parsing fails, log it and continue to the fallback
                        log.info(`JSON parse error: ${innerError}. Will use fallback parsing for: ${jsonStr}`);
                    }
                }

                // Fallback 1: Try to extract an array manually by splitting on commas between quotes
                if (jsonStr.includes('[') && jsonStr.includes(']')) {
                    const arrayContent = jsonStr.substring(
                        jsonStr.indexOf('[') + 1,
                        jsonStr.lastIndexOf(']')
                    );

                    // Use regex to match quoted strings, handling escaped quotes
                    const stringMatches = arrayContent.match(/"((?:\\.|[^"\\])*)"/g);
                    if (stringMatches && stringMatches.length > 0) {
                        return stringMatches
                            .map((m: string) => m.substring(1, m.length - 1)) // Remove surrounding quotes
                            .filter((s: string) => s.length > 0);
                    }
                }

                // Fallback 2: Extract queries line by line
                const lines = responseText.split('\n')
                    .map((line: string) => line.trim())
                    .filter((line: string) =>
                        line.length > 0 &&
                        !line.startsWith('```') &&
                        !line.match(/^\d+\.?\s*$/) && // Skip numbered list markers alone
                        !line.match(/^\[|\]$/) // Skip lines that are just brackets
                    );

                if (lines.length > 0) {
                    // Remove numbering, quotes and other list markers from each line
                    return lines.map((line: string) => {
                        return line
                            .replace(/^\d+\.?\s*/, '') // Remove numbered list markers (1., 2., etc)
                            .replace(/^[-*•]\s*/, '')  // Remove bullet list markers
                            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
                            .trim();
                    }).filter((s: string) => s.length > 0);
                }
            } catch (parseError) {
                log.error(`Error parsing search queries: ${parseError}`);
            }

            // If all else fails, just use the original question
            return [userQuestion];
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error generating search queries: ${errorMessage}`);
            // Fallback to just using the original question
            return [userQuestion];
        }
    }

    /**
     * Find relevant notes using multiple search queries
     * @param queries - Array of search queries
     * @param contextNoteId - Optional note ID to restrict search to a branch
     * @param limit - Max notes to return
     * @returns Array of relevant notes
     */
    async findRelevantNotesMultiQuery(
        queries: string[],
        contextNoteId: string | null = null,
        limit = 10
    ): Promise<any[]> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Cache key combining all queries
            const cacheKey = JSON.stringify({ queries, contextNoteId, limit });

            // Check if we have a recent cache hit
            const cached = this.recentQueriesCache.get(cacheKey);
            if (cached) {
                return cached.relevantNotes;
            }

            // Array to store all results with their similarity scores
            const allResults: {
                noteId: string,
                title: string,
                content: string | null,
                similarity: number,
                branchId?: string
            }[] = [];

            // Set to keep track of note IDs we've seen to avoid duplicates
            const seenNoteIds = new Set<string>();

            // Log the provider and model being used
            log.info(`Searching with embedding provider: ${this.provider.name}, model: ${this.provider.getConfig().model}`);

            // Process each query
            for (const query of queries) {
                // Get embeddings for this query using the correct method name
                const queryEmbedding = await this.provider.generateEmbeddings(query);
                log.info(`Generated embedding for query: "${query}" (${queryEmbedding.length} dimensions)`);

                // Find notes similar to this query
                let results;
                if (contextNoteId) {
                    // Find within a specific context/branch
                    results = await this.findNotesInBranch(
                        queryEmbedding,
                        contextNoteId,
                        Math.min(limit, 5) // Limit per query
                    );
                    log.info(`Found ${results.length} notes within branch context for query: "${query}"`);
                } else {
                    // Search all notes
                    results = await vectorStore.findSimilarNotes(
                        queryEmbedding,
                        this.provider.name, // Use name property instead of id
                        this.provider.getConfig().model, // Use getConfig().model instead of modelId
                        Math.min(limit, 5), // Limit per query
                        0.5 // Lower threshold to get more diverse results
                    );
                    log.info(`Found ${results.length} notes in vector store for query: "${query}"`);
                }

                // Process results
                for (const result of results) {
                    if (!seenNoteIds.has(result.noteId)) {
                        seenNoteIds.add(result.noteId);

                        // Get the note from Becca
                        const note = becca.notes[result.noteId];
                        if (!note) continue;

                        // Add to our results
                        allResults.push({
                            noteId: result.noteId,
                            title: note.title,
                            content: note.type === 'text' ? note.getContent() as string : null,
                            similarity: result.similarity,
                            branchId: note.getBranches()[0]?.branchId
                        });
                    }
                }
            }

            // Sort by similarity and take the top 'limit' results
            const sortedResults = allResults
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);

            log.info(`Total unique relevant notes found across all queries: ${sortedResults.length}`);

            // Cache the results
            this.recentQueriesCache.set(cacheKey, {
                timestamp: Date.now(),
                relevantNotes: sortedResults
            });

            return sortedResults;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error finding relevant notes: ${errorMessage}`);
            return [];
        }
    }

    /**
     * Find notes in a specific branch/context
     * @param embedding - Query embedding
     * @param contextNoteId - Note ID to restrict search to
     * @param limit - Max notes to return
     * @returns Array of relevant notes
     */
    private async findNotesInBranch(
        embedding: Float32Array,
        contextNoteId: string,
        limit = 5
    ): Promise<{noteId: string, similarity: number}[]> {
        try {
            // Get the subtree note IDs
            const subtreeNoteIds = await this.getSubtreeNoteIds(contextNoteId);

            if (subtreeNoteIds.length === 0) {
                return [];
            }

            // Get all embeddings for these notes using vectorStore instead of direct SQL
            const similarities: {noteId: string, similarity: number}[] = [];

            for (const noteId of subtreeNoteIds) {
                const noteEmbedding = await vectorStore.getEmbeddingForNote(
                    noteId,
                    this.provider.name, // Use name property instead of id
                    this.provider.getConfig().model // Use getConfig().model instead of modelId
                );

                if (noteEmbedding) {
                    const similarity = cosineSimilarity(embedding, noteEmbedding.embedding);
                    if (similarity > 0.5) {  // Apply similarity threshold
                        similarities.push({
                            noteId,
                            similarity
                        });
                    }
                }
            }

            // Sort by similarity and return top results
            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error finding notes in branch: ${errorMessage}`);
            return [];
        }
    }

    /**
     * Get all note IDs in a subtree (including the root note)
     * @param rootNoteId - Root note ID
     * @returns Array of note IDs
     */
    private async getSubtreeNoteIds(rootNoteId: string): Promise<string[]> {
        const note = becca.notes[rootNoteId];
        if (!note) {
            return [];
        }

        // Use becca to walk the note tree instead of direct SQL
        const noteIds = new Set<string>([rootNoteId]);

        // Helper function to collect all children
        const collectChildNotes = (noteId: string) => {
            // Use becca.getNote(noteId).getChildNotes() to get child notes
            const parentNote = becca.notes[noteId];
            if (!parentNote) return;

            // Get all branches where this note is the parent
            for (const branch of Object.values(becca.branches)) {
                if (branch.parentNoteId === noteId && !branch.isDeleted) {
                    const childNoteId = branch.noteId;
                    if (!noteIds.has(childNoteId)) {
                        noteIds.add(childNoteId);
                        // Recursively collect children of this child
                        collectChildNotes(childNoteId);
                    }
                }
            }
        };

        // Start collecting from the root
        collectChildNotes(rootNoteId);

        return Array.from(noteIds);
    }

    /**
     * Build context string from retrieved notes
     */
    async buildContextFromNotes(sources: any[], query: string): Promise<string> {
        if (!sources || sources.length === 0) {
            // Return a default context instead of empty string
            return "I am an AI assistant helping you with your Trilium notes. " +
                   "I couldn't find any specific notes related to your query, but I'll try to assist you " +
                   "with general knowledge about Trilium or other topics you're interested in.";
        }

        // Get provider name to adjust context for different models
        const providerId = this.provider?.name || 'default';

        // Import the constants dynamically to avoid circular dependencies
        const { LLM_CONSTANTS } = await import('../../routes/api/llm.js');

        // Get appropriate context size and format based on provider
        const maxTotalLength =
            providerId === 'openai' ? LLM_CONSTANTS.CONTEXT_WINDOW.OPENAI :
            providerId === 'anthropic' ? LLM_CONSTANTS.CONTEXT_WINDOW.ANTHROPIC :
            providerId === 'ollama' ? LLM_CONSTANTS.CONTEXT_WINDOW.OLLAMA :
            LLM_CONSTANTS.CONTEXT_WINDOW.DEFAULT;

        // Use a format appropriate for the model family
        // Anthropic has a specific system message format that works better with certain structures
        const isAnthropicFormat = providerId === 'anthropic';

        // Start with different headers based on provider
        let context = isAnthropicFormat
            ? `I'm your AI assistant helping with your Trilium notes database. For your query: "${query}", I found these relevant notes:\n\n`
            : `I've found some relevant information in your notes that may help answer: "${query}"\n\n`;

        // Sort sources by similarity if available to prioritize most relevant
        if (sources[0] && sources[0].similarity !== undefined) {
            sources = [...sources].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
        }

        // Track total context length to avoid oversized context
        let currentLength = context.length;
        const maxNoteContentLength = Math.min(LLM_CONSTANTS.CONTENT.MAX_NOTE_CONTENT_LENGTH,
                                   Math.floor(maxTotalLength / Math.max(1, sources.length)));

        sources.forEach((source) => {
            // Check if adding this source would exceed our total limit
            if (currentLength >= maxTotalLength) return;

            // Build source section with formatting appropriate for the provider
            let sourceSection = `### ${source.title}\n`;

            // Add relationship context if available
            if (source.parentTitle) {
                sourceSection += `Part of: ${source.parentTitle}\n`;
            }

            // Add attributes if available (for better context)
            if (source.noteId) {
                const note = becca.notes[source.noteId];
                if (note) {
                    const labels = note.getLabels();
                    if (labels.length > 0) {
                        sourceSection += `Labels: ${labels.map(l => `#${l.name}${l.value ? '=' + l.value : ''}`).join(' ')}\n`;
                    }
                }
            }

            if (source.content) {
                // Clean up HTML content before adding it to the context
                let cleanContent = this.sanitizeNoteContent(source.content, source.type, source.mime);

                // Truncate content if it's too long
                if (cleanContent.length > maxNoteContentLength) {
                    cleanContent = cleanContent.substring(0, maxNoteContentLength) + " [content truncated due to length]";
                }

                sourceSection += `${cleanContent}\n`;
            } else {
                sourceSection += "[This note doesn't contain textual content]\n";
            }

            sourceSection += "\n";

            // Check if adding this section would exceed total length limit
            if (currentLength + sourceSection.length <= maxTotalLength) {
                context += sourceSection;
                currentLength += sourceSection.length;
            }
        });

        // Add provider-specific instructions
        if (isAnthropicFormat) {
            context += "When you refer to any information from these notes, cite the note title explicitly (e.g., \"According to the note [Title]...\"). " +
                      "If the provided notes don't answer the query fully, acknowledge that and then use your general knowledge to help.\n\n" +
                      "Be concise but thorough in your responses.";
        } else {
            context += "When referring to information from these notes in your response, please cite them by their titles " +
                      "(e.g., \"According to your note on [Title]...\") rather than using labels like \"Note 1\" or \"Note 2\".\n\n" +
                      "If the information doesn't contain what you need, just say so and use your general knowledge instead.";
        }

        return context;
    }

    /**
     * Sanitize note content for use in context, removing HTML tags
     */
    private sanitizeNoteContent(content: string, type?: string, mime?: string): string {
        if (!content) return '';

        // If it's likely HTML content
        if (
            (type === 'text' && mime === 'text/html') ||
            content.includes('<div') ||
            content.includes('<p>') ||
            content.includes('<span')
        ) {
            // Use sanitizeHtml to remove all HTML tags
            content = sanitizeHtml(content, {
                allowedTags: [],
                allowedAttributes: {},
                textFilter: (text) => {
                    // Replace multiple newlines with a single one
                    return text.replace(/\n\s*\n/g, '\n\n');
                }
            });

            // Additional cleanup for remaining HTML entities
            content = content
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
        }

        // Normalize whitespace
        content = content.replace(/\s+/g, ' ').trim();

        return content;
    }

    /**
     * Process a user query with the Trilium-specific approach:
     * 1. Generate search queries from the original question
     * 2. Find relevant notes using those queries
     * 3. Build a context string from the relevant notes
     *
     * @param userQuestion - The user's original question
     * @param llmService - The LLM service to use
     * @param contextNoteId - Optional note ID to restrict search to
     * @returns Object with context and notes
     */
    async processQuery(userQuestion: string, llmService: any, contextNoteId: string | null = null) {
        if (!this.initialized) {
            try {
                await this.initialize();
            } catch (error) {
                log.error(`Failed to initialize TriliumContextService: ${error}`);
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
                searchQueries = await this.generateSearchQueries(userQuestion, llmService);
            } catch (error) {
                log.error(`Error generating search queries, using fallback: ${error}`);
                searchQueries = [userQuestion]; // Fallback to using the original question
            }
            log.info(`Generated search queries: ${JSON.stringify(searchQueries)}`);

            // Step 2: Find relevant notes using those queries
            let relevantNotes: any[] = [];
            try {
                relevantNotes = await this.findRelevantNotesMultiQuery(
                    searchQueries,
                    contextNoteId,
                    8 // Get more notes since we're using multiple queries
                );
            } catch (error) {
                log.error(`Error finding relevant notes: ${error}`);
                // Continue with empty notes list
            }

            // Step 3: Build context from the notes
            const context = await this.buildContextFromNotes(relevantNotes, userQuestion);

            return {
                context,
                notes: relevantNotes,
                queries: searchQueries
            };
        } catch (error) {
            log.error(`Error in processQuery: ${error}`);
            // Return a fallback response if anything fails
            return {
                context: "I am an AI assistant helping you with your Trilium notes. " +
                         "I encountered an error while processing your query, but I'll try to assist you anyway.",
                notes: [],
                queries: [userQuestion]
            };
        }
    }
}

export default new TriliumContextService();
