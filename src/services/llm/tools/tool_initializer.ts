/**
 * Tool Initializer
 * 
 * This module initializes all available tools for the LLM to use.
 */

import toolRegistry from './tool_registry.js';
import { SearchNotesTool } from './search_notes_tool.js';
import { ReadNoteTool } from './read_note_tool.js';
import log from '../../log.js';

/**
 * Initialize all tools for the LLM
 */
export async function initializeTools(): Promise<void> {
    try {
        log.info('Initializing LLM tools...');
        
        // Register basic notes tools
        toolRegistry.registerTool(new SearchNotesTool());
        toolRegistry.registerTool(new ReadNoteTool());
        
        // More tools can be registered here
        
        // Log registered tools
        const toolCount = toolRegistry.getAllTools().length;
        log.info(`Successfully registered ${toolCount} LLM tools`);
    } catch (error: any) {
        log.error(`Error initializing LLM tools: ${error.message || String(error)}`);
        // Don't throw, just log the error to prevent breaking the pipeline
    }
}

export default {
    initializeTools
};
