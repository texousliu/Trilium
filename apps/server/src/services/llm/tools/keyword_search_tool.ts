/**
 * Keyword Search Notes Tool
 *
 * This tool allows the LLM to search for notes using exact keyword matching and attribute-based filters.
 * It complements the semantic search tool by providing more precise, rule-based search capabilities.
 */

import type { Tool, ToolHandler } from './tool_interfaces.js';
import log from '../../log.js';
import searchService from '../../search/services/search.js';
import becca from '../../../becca/becca.js';

/**
 * Definition of the keyword search notes tool
 */
export const keywordSearchToolDefinition: Tool = {
    type: 'function',
    function: {
        name: 'keyword_search_notes',
        description: `EXACT KEYWORD search for notes. Finds notes containing specific words, phrases, or attribute filters.
        
        BEST FOR: Finding notes with specific words/phrases you know exist
        USE WHEN: You need exact text matches, specific terms, or attribute-based filtering
        DIFFERENT FROM: search_notes (which finds conceptual/semantic matches)
        
        SEARCH TYPES:
        • Simple: "machine learning" (finds notes containing both words)
        • Phrase: "\"exact phrase\"" (finds this exact phrase)
        • Attributes: "#label" or "~relation" (notes with specific labels/relations)
        • Complex: "AI #project ~relatedTo" (combines keywords with attributes)
        
        NEXT STEPS: Use read_note with returned noteId values for full content`,
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: `Keyword search query using Trilium search syntax.
                    
                    SIMPLE EXAMPLES:
                    - "machine learning" (both words anywhere)
                    - "\"project management\"" (exact phrase)
                    - "python OR javascript" (either word)
                    
                    ATTRIBUTE EXAMPLES:
                    - "#important" (notes with 'important' label)
                    - "~project" (notes with 'project' relation)
                    - "#status = completed" (specific label value)
                    
                    COMBINED EXAMPLES:
                    - "AI #project #status = active" (AI content with project label and active status)
                    - "note.title *= \"weekly\"" (titles containing 'weekly')
                    
                    AVOID: Conceptual queries better suited for search_notes`
                },
                maxResults: {
                    type: 'number',
                    description: 'Number of results (1-50, default: 10). Use higher values for comprehensive searches.'
                },
                includeArchived: {
                    type: 'boolean',
                    description: 'INCLUDE ARCHIVED: Search archived notes too (default: false). Use true for complete historical search.'
                }
            },
            required: ['query']
        }
    }
};

/**
 * Keyword search notes tool implementation
 */
export class KeywordSearchTool implements ToolHandler {
    public definition: Tool = keywordSearchToolDefinition;

    /**
     * Convert a keyword query to a semantic query suggestion
     */
    private convertToSemanticQuery(keywordQuery: string): string {
        // Remove search operators and attributes to create a semantic query
        return keywordQuery
            .replace(/#\w+/g, '') // Remove label filters
            .replace(/~\w+/g, '') // Remove relation filters
            .replace(/\"[^\"]*\"/g, (match) => match.slice(1, -1)) // Remove quotes but keep content
            .replace(/\s+OR\s+/gi, ' ') // Replace OR with space
            .replace(/\s+AND\s+/gi, ' ') // Replace AND with space
            .replace(/note\.(title|content)\s*\*=\*\s*/gi, '') // Remove note.content operators
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
    }

    /**
     * Execute the keyword search notes tool
     */
    public async execute(args: { query: string, maxResults?: number, includeArchived?: boolean }): Promise<string | object> {
        try {
            const { query, maxResults = 10, includeArchived = false } = args;

            log.info(`Executing keyword_search_notes tool - Query: "${query}", MaxResults: ${maxResults}, IncludeArchived: ${includeArchived}`);

            // Execute the search
            log.info(`Performing keyword search for: "${query}"`);
            const searchStartTime = Date.now();

            // Find results with the given query
            const searchContext = {
                includeArchivedNotes: includeArchived,
                fuzzyAttributeSearch: false
            };

            const searchResults = searchService.searchNotes(query, searchContext);
            const limitedResults = searchResults.slice(0, maxResults);

            const searchDuration = Date.now() - searchStartTime;

            log.info(`Keyword search completed in ${searchDuration}ms, found ${searchResults.length} matching notes, returning ${limitedResults.length}`);

            if (limitedResults.length > 0) {
                // Log top results
                limitedResults.slice(0, 3).forEach((result, index) => {
                    log.info(`Result ${index + 1}: "${result.title}"`);
                });
            } else {
                log.info(`No matching notes found for query: "${query}"`);
            }

            // Format the results with enhanced guidance
            if (limitedResults.length === 0) {
                return {
                    count: 0,
                    results: [],
                    query: query,
                    searchType: 'keyword',
                    message: 'No exact keyword matches found.',
                    nextSteps: {
                        immediate: [
                            `Try search_notes for semantic/conceptual search: "${this.convertToSemanticQuery(query)}"`,
                            `Use attribute_search if looking for specific labels or relations`,
                            `Try simpler keywords or check spelling`
                        ],
                        queryHelp: [
                            'Remove quotes for broader matching',
                            'Try individual words instead of phrases',
                            'Use OR operator: "word1 OR word2"',
                            'Check if content might be in archived notes (set includeArchived: true)'
                        ]
                    }
                };
            }
            
            return {
                count: limitedResults.length,
                totalFound: searchResults.length,
                query: query,
                searchType: 'keyword',
                message: 'Found exact keyword matches. Use noteId values with other tools.',
                nextSteps: {
                    examine: `Use read_note with any noteId (e.g., "${limitedResults[0].noteId}") to get full content`,
                    refine: limitedResults.length < searchResults.length ? `Found ${searchResults.length} total matches (showing ${limitedResults.length}). Increase maxResults for more.` : null,
                    related: 'Use search_notes for conceptually related content beyond exact keywords'
                },
                results: limitedResults.map(note => {
                    // Get a preview of the note content with highlighted search terms
                    let contentPreview = '';
                    try {
                        const content = note.getContent();
                        if (typeof content === 'string') {
                            contentPreview = content.length > 200 ? content.substring(0, 200) + '...' : content;
                        } else if (Buffer.isBuffer(content)) {
                            contentPreview = '[Binary content]';
                        } else {
                            contentPreview = String(content).substring(0, 200) + (String(content).length > 200 ? '...' : '');
                        }
                    } catch (e) {
                        contentPreview = '[Content not available]';
                    }

                    // Get note attributes
                    const attributes = note.getOwnedAttributes().map(attr => ({
                        type: attr.type,
                        name: attr.name,
                        value: attr.value
                    }));

                    return {
                        noteId: note.noteId,
                        title: note.title,
                        preview: contentPreview,
                        attributes: attributes.length > 0 ? attributes : undefined,
                        type: note.type,
                        mime: note.mime,
                        isArchived: note.isArchived,
                        dateModified: note.dateModified
                    };
                })
            };
        } catch (error: any) {
            log.error(`Error executing keyword_search_notes tool: ${error.message || String(error)}`);
            return `Error: ${error.message || String(error)}`;
        }
    }
}
