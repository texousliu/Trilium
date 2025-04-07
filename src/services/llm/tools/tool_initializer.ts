/**
 * Tool Initializer
 *
 * This module initializes all available tools for the LLM to use.
 */

import toolRegistry from './tool_registry.js';
import { SearchNotesTool } from './search_notes_tool.js';
import { ReadNoteTool } from './read_note_tool.js';
import { NoteCreationTool } from './note_creation_tool.js';
import { NoteUpdateTool } from './note_update_tool.js';
import { ContentExtractionTool } from './content_extraction_tool.js';
import { RelationshipTool } from './relationship_tool.js';
import log from '../../log.js';

/**
 * Initialize all tools for the LLM
 */
export async function initializeTools(): Promise<void> {
    try {
        log.info('Initializing LLM tools...');

        // Register basic note search and read tools
        toolRegistry.registerTool(new SearchNotesTool());
        toolRegistry.registerTool(new ReadNoteTool());

        // Register note creation and manipulation tools
        toolRegistry.registerTool(new NoteCreationTool());
        toolRegistry.registerTool(new NoteUpdateTool());

        // Register content analysis tools
        toolRegistry.registerTool(new ContentExtractionTool());
        toolRegistry.registerTool(new RelationshipTool());

        // Log registered tools
        const toolCount = toolRegistry.getAllTools().length;
        const toolNames = toolRegistry.getAllTools().map(tool => tool.definition.function.name).join(', ');
        log.info(`Successfully registered ${toolCount} LLM tools: ${toolNames}`);
    } catch (error: any) {
        log.error(`Error initializing LLM tools: ${error.message || String(error)}`);
        // Don't throw, just log the error to prevent breaking the pipeline
    }
}

export default {
    initializeTools
};
