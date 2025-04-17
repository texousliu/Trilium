/**
 * Search Notes Tool
 *
 * This tool allows the LLM to search for notes using semantic search.
 */

import type { Tool, ToolHandler } from './tool_interfaces.js';
import log from '../../log.js';
import aiServiceManager from '../ai_service_manager.js';

/**
 * Definition of the search notes tool
 */
export const searchNotesToolDefinition: Tool = {
    type: 'function',
    function: {
        name: 'search_notes',
        description: 'Search for notes in the database using semantic search. Returns notes most semantically related to the query.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to find semantically related notes'
                },
                parentNoteId: {
                    type: 'string',
                    description: 'Optional parent note ID to restrict search to a specific branch'
                },
                maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return (default: 5)'
                }
            },
            required: ['query']
        }
    }
};

/**
 * Get or create the vector search tool dependency
 * @returns The vector search tool or null if it couldn't be created
 */
async function getOrCreateVectorSearchTool(): Promise<any> {
    try {
        // Try to get the existing vector search tool
        let vectorSearchTool = aiServiceManager.getVectorSearchTool();

        if (vectorSearchTool) {
            log.info(`Found existing vectorSearchTool`);
            return vectorSearchTool;
        }

        // No existing tool, try to initialize it
        log.info(`VectorSearchTool not found, attempting initialization`);

        // Get agent tools manager and initialize it
        const agentTools = aiServiceManager.getAgentTools();
        if (agentTools && typeof agentTools.initialize === 'function') {
            log.info('Initializing agent tools to create vectorSearchTool');
            try {
                // Force initialization to ensure it runs even if previously marked as initialized
                await agentTools.initialize(true);
                log.info('Agent tools initialized successfully');
            } catch (initError: any) {
                log.error(`Failed to initialize agent tools: ${initError.message}`);
                return null;
            }
        } else {
            log.error('Agent tools manager not available');
            return null;
        }

        // Try getting the vector search tool again after initialization
        vectorSearchTool = aiServiceManager.getVectorSearchTool();

        if (vectorSearchTool) {
            log.info('Successfully created vectorSearchTool');
            return vectorSearchTool;
        } else {
            log.error('Failed to create vectorSearchTool after initialization');
            return null;
        }
    } catch (error: any) {
        log.error(`Error getting or creating vectorSearchTool: ${error.message}`);
        return null;
    }
}

/**
 * Search notes tool implementation
 */
export class SearchNotesTool implements ToolHandler {
    public definition: Tool = searchNotesToolDefinition;

    /**
     * Execute the search notes tool
     */
    public async execute(args: { query: string, parentNoteId?: string, maxResults?: number }): Promise<string | object> {
        try {
            const { query, parentNoteId, maxResults = 5 } = args;

            log.info(`Executing search_notes tool - Query: "${query}", ParentNoteId: ${parentNoteId || 'not specified'}, MaxResults: ${maxResults}`);

            // Get the vector search tool from the AI service manager
            const vectorSearchTool = await getOrCreateVectorSearchTool();

            if (!vectorSearchTool) {
                return `Error: Vector search tool is not available. The system may still be initializing or there could be a configuration issue.`;
            }

            log.info(`Retrieved vector search tool from AI service manager`);

            // Check if searchNotes method exists
            if (!vectorSearchTool.searchNotes || typeof vectorSearchTool.searchNotes !== 'function') {
                log.error(`Vector search tool is missing searchNotes method`);
                return `Error: Vector search tool is improperly configured (missing searchNotes method).`;
            }

            // Execute the search
            log.info(`Performing semantic search for: "${query}"`);
            const searchStartTime = Date.now();
            const results = await vectorSearchTool.searchNotes(query, {
                parentNoteId,
                maxResults
            });
            const searchDuration = Date.now() - searchStartTime;

            log.info(`Search completed in ${searchDuration}ms, found ${results.length} matching notes`);

            if (results.length > 0) {
                // Log top results
                results.slice(0, 3).forEach((result: any, index: number) => {
                    log.info(`Result ${index + 1}: "${result.title}" (similarity: ${Math.round(result.similarity * 100)}%)`);
                });
            } else {
                log.info(`No matching notes found for query: "${query}"`);
            }

            // Format the results
            return {
                count: results.length,
                results: results.map((result: any) => ({
                    noteId: result.noteId,
                    title: result.title,
                    preview: result.contentPreview,
                    similarity: Math.round(result.similarity * 100) / 100,
                    parentId: result.parentId
                }))
            };
        } catch (error: any) {
            log.error(`Error executing search_notes tool: ${error.message || String(error)}`);
            return `Error: ${error.message || String(error)}`;
        }
    }
}
