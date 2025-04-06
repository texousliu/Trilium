import { BasePipelineStage } from '../pipeline_stage.js';
import type { VectorSearchInput } from '../interfaces.js';
import type { NoteSearchResult } from '../../interfaces/context_interfaces.js';
import log from '../../../log.js';
import queryEnhancer from '../../context/modules/query_enhancer.js';
import semanticSearch from '../../context/modules/semantic_search.js';
import aiServiceManager from '../../ai_service_manager.js';

/**
 * Pipeline stage for handling semantic vector search with query enhancement
 * This centralizes all semantic search operations into the pipeline
 */
export class VectorSearchStage extends BasePipelineStage<VectorSearchInput, { 
    searchResults: NoteSearchResult[], 
    enhancedQueries?: string[] 
}> {
    constructor() {
        super('VectorSearch');
    }

    /**
     * Execute semantic search with optional query enhancement
     */
    protected async process(input: VectorSearchInput): Promise<{ 
        searchResults: NoteSearchResult[], 
        enhancedQueries?: string[] 
    }> {
        const { query, noteId, options = {} } = input;
        const { 
            maxResults = 10, 
            useEnhancedQueries = true,
            threshold = 0.6,
            llmService = null
        } = options;
        
        log.info(`========== PIPELINE VECTOR SEARCH ==========`);
        log.info(`Query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`);
        log.info(`Parameters: noteId=${noteId || 'global'}, maxResults=${maxResults}, useEnhancedQueries=${useEnhancedQueries}, threshold=${threshold}`);
        log.info(`LLM Service provided: ${llmService ? 'yes' : 'no'}`);
        log.info(`Start timestamp: ${new Date().toISOString()}`);
        
        try {
            // STEP 1: Generate enhanced search queries if requested
            let searchQueries: string[] = [query];
            
            if (useEnhancedQueries) {
                log.info(`PIPELINE VECTOR SEARCH: Generating enhanced queries for: "${query.substring(0, 50)}..."`);
                
                try {
                    // Get the LLM service to use for query enhancement
                    let enhancementService = llmService;
                    
                    // If no service provided, use AI service manager to get the default service
                    if (!enhancementService) {
                        log.info(`No LLM service provided, using default from AI service manager`);
                        const manager = aiServiceManager.getInstance();
                        const provider = manager.getPreferredProvider();
                        enhancementService = manager.getService(provider);
                        log.info(`Using preferred provider "${provider}" with service type ${enhancementService.constructor.name}`);
                    }
                    
                    // Create a special service wrapper that prevents recursion
                    const recursionPreventionService = {
                        generateChatCompletion: async (messages: any, options: any) => {
                            // Add flags to prevent recursive calls
                            const safeOptions = {
                                ...options,
                                bypassFormatter: true,
                                _bypassContextProcessing: true,
                                bypassQueryEnhancement: true, // Critical flag
                                directToolExecution: true,
                                enableTools: false // Disable tools for query enhancement
                            };
                            
                            // Use the actual service implementation but with safe options
                            return enhancementService.generateChatCompletion(messages, safeOptions);
                        }
                    };
                    
                    // Call the query enhancer with the safe service
                    searchQueries = await queryEnhancer.generateSearchQueries(query, recursionPreventionService);
                    log.info(`PIPELINE VECTOR SEARCH: Generated ${searchQueries.length} enhanced queries`);
                } catch (error) {
                    log.error(`PIPELINE VECTOR SEARCH: Error generating search queries, using original: ${error}`);
                    searchQueries = [query]; // Fall back to original query
                }
            } else {
                log.info(`PIPELINE VECTOR SEARCH: Using direct query without enhancement: "${query}"`);
            }
            
            // STEP 2: Find relevant notes for each query
            const allResults = new Map<string, NoteSearchResult>();
            log.info(`PIPELINE VECTOR SEARCH: Searching for ${searchQueries.length} queries`);
            
            for (const searchQuery of searchQueries) {
                try {
                    log.info(`PIPELINE VECTOR SEARCH: Processing query: "${searchQuery.substring(0, 50)}..."`);
                    const results = await semanticSearch.findRelevantNotes(
                        searchQuery,
                        noteId || null,
                        maxResults
                    );
                    
                    log.info(`PIPELINE VECTOR SEARCH: Found ${results.length} results for query "${searchQuery.substring(0, 50)}..."`);
                    
                    // Combine results, avoiding duplicates and keeping the highest similarity score
                    for (const result of results) {
                        if (!allResults.has(result.noteId)) {
                            allResults.set(result.noteId, result);
                        } else {
                            // If note already exists, update similarity to max of both values
                            const existing = allResults.get(result.noteId);
                            if (existing && result.similarity > existing.similarity) {
                                existing.similarity = result.similarity;
                                allResults.set(result.noteId, existing);
                            }
                        }
                    }
                } catch (error) {
                    log.error(`PIPELINE VECTOR SEARCH: Error searching for query "${searchQuery}": ${error}`);
                }
            }
            
            // STEP 3: Convert to array, filter and sort
            const filteredResults = Array.from(allResults.values())
                .filter(note => {
                    // Filter out notes with no content or very minimal content
                    const hasContent = note.content && note.content.trim().length > 10;
                    // Apply similarity threshold
                    const meetsThreshold = note.similarity >= threshold;
                    
                    if (!hasContent) {
                        log.info(`PIPELINE VECTOR SEARCH: Filtering out empty/minimal note: "${note.title}" (${note.noteId})`);
                    }
                    
                    if (!meetsThreshold) {
                        log.info(`PIPELINE VECTOR SEARCH: Filtering out low similarity note: "${note.title}" - ${Math.round(note.similarity * 100)}% < ${Math.round(threshold * 100)}%`);
                    }
                    
                    return hasContent && meetsThreshold;
                })
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, maxResults);
            
            log.info(`PIPELINE VECTOR SEARCH: Search complete, returning ${filteredResults.length} results after filtering`);
            
            // Log top results in detail
            if (filteredResults.length > 0) {
                log.info(`========== VECTOR SEARCH RESULTS ==========`);
                log.info(`Found ${filteredResults.length} relevant notes after filtering`);
                
                const topResults = filteredResults.slice(0, 5); // Show top 5 for better diagnostics
                topResults.forEach((result, idx) => {
                    log.info(`Result ${idx+1}:`);
                    log.info(`  Title: "${result.title}"`);
                    log.info(`  NoteID: ${result.noteId}`);
                    log.info(`  Similarity: ${Math.round(result.similarity * 100)}%`);
                    
                    if (result.content) {
                        const contentPreview = result.content.length > 150 
                            ? `${result.content.substring(0, 150)}...` 
                            : result.content;
                        log.info(`  Content preview: ${contentPreview}`);
                        log.info(`  Content length: ${result.content.length} chars`);
                    } else {
                        log.info(`  Content: None or not loaded`);
                    }
                });
                
                if (filteredResults.length > 5) {
                    log.info(`... and ${filteredResults.length - 5} more results not shown`);
                }
                
                log.info(`========== END VECTOR SEARCH RESULTS ==========`);
            } else {
                log.info(`No results found that meet the similarity threshold of ${threshold}`);
            }
            
            // Log final statistics
            log.info(`Vector search statistics:`);
            log.info(`  Original query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
            if (searchQueries.length > 1) {
                log.info(`  Enhanced with ${searchQueries.length} search queries`);
                searchQueries.forEach((q, i) => {
                    if (i > 0) { // Skip the original query
                        log.info(`    Query ${i}: "${q.substring(0, 50)}${q.length > 50 ? '...' : ''}"`);
                    }
                });
            }
            log.info(`  Final results: ${filteredResults.length} notes`);
            log.info(`  End timestamp: ${new Date().toISOString()}`);
            log.info(`========== END PIPELINE VECTOR SEARCH ==========`);
            
            return { 
                searchResults: filteredResults,
                enhancedQueries: useEnhancedQueries ? searchQueries : undefined
            };
        } catch (error: any) {
            log.error(`PIPELINE VECTOR SEARCH: Error in vector search stage: ${error.message || String(error)}`);
            return { 
                searchResults: [],
                enhancedQueries: undefined
            };
        }
    }
}