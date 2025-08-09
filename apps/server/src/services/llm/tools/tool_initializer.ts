/**
 * Tool Initializer
 *
 * This module initializes all available tools for the LLM to use.
 * Phase 2.3: Now includes smart parameter processing for enhanced LLM tool usage.
 */

import toolRegistry from './tool_registry.js';
import { SearchNotesTool } from './search_notes_tool.js';
import { KeywordSearchTool } from './keyword_search_tool.js';
import { AttributeSearchTool } from './attribute_search_tool.js';
import { SmartSearchTool } from './smart_search_tool.js';
import { ExecuteBatchTool } from './execute_batch_tool.js';
import { SmartRetryTool } from './smart_retry_tool.js';
import { SearchSuggestionTool } from './search_suggestion_tool.js';
import { ReadNoteTool } from './read_note_tool.js';
import { NoteCreationTool } from './note_creation_tool.js';
import { NoteUpdateTool } from './note_update_tool.js';
import { ContentExtractionTool } from './content_extraction_tool.js';
import { RelationshipTool } from './relationship_tool.js';
import { AttributeManagerTool } from './attribute_manager_tool.js';
import { CalendarIntegrationTool } from './calendar_integration_tool.js';
import { NoteSummarizationTool } from './note_summarization_tool.js';
import { ToolDiscoveryHelper } from './tool_discovery_helper.js';
// Phase 2.1 Compound Workflow Tools
import { FindAndReadTool } from './find_and_read_tool.js';
import { FindAndUpdateTool } from './find_and_update_tool.js';
import { CreateWithTemplateTool } from './create_with_template_tool.js';
import { CreateOrganizedTool } from './create_organized_tool.js';
import { BulkUpdateTool } from './bulk_update_tool.js';
// Phase 2.2 Trilium-Native Tools
import { CloneNoteTool } from './clone_note_tool.js';
import { OrganizeHierarchyTool } from './organize_hierarchy_tool.js';
import { TemplateManagerTool } from './template_manager_tool.js';
import { ProtectedNoteTool } from './protected_note_tool.js';
import { NoteTypeConverterTool } from './note_type_converter_tool.js';
import { RevisionManagerTool } from './revision_manager_tool.js';
// Phase 2.3 Smart Parameter Processing
import { createSmartTool, smartToolRegistry } from './smart_tool_wrapper.js';
import type { ProcessingContext } from './smart_parameter_processor.js';
import log from '../../log.js';

// Error type guard
function isError(error: unknown): error is Error {
    return error instanceof Error || (typeof error === 'object' &&
           error !== null && 'message' in error);
}

/**
 * Initialize all tools for the LLM with Phase 2.3 Smart Parameter Processing
 */
export async function initializeTools(): Promise<void> {
    try {
        log.info('Initializing LLM tools with smart parameter processing...');

        // Create processing context for smart tools
        const processingContext: ProcessingContext = {
            toolName: 'global',
            recentNoteIds: [], // TODO: Could be populated from user session
            currentNoteId: undefined,
            userPreferences: {}
        };

        // Create tool instances
        const tools = [
            // Core utility tools FIRST (highest priority)
            new ExecuteBatchTool(),       // Batch execution for parallel tools
            new SmartSearchTool(),        // Intelligent search with automatic method selection and fallback
            new SmartRetryTool(),         // Automatic retry with variations
            new ReadNoteTool(),           // Read note content
            
            // Phase 2.1 Compound Workflow Tools (high priority - reduce LLM tool calls)
            new FindAndReadTool(),        // Smart search + content reading in one step
            new FindAndUpdateTool(),      // Smart search + note update in one step
            new CreateWithTemplateTool(), // Template-based note creation with structure
            new CreateOrganizedTool(),    // Organized note creation with hierarchy
            new BulkUpdateTool(),         // Bulk update multiple notes matching criteria
            
            // Phase 2.2 Trilium-Native Tools (Trilium-specific advanced features)
            new CloneNoteTool(),          // Multi-parent note cloning (unique to Trilium)
            new OrganizeHierarchyTool(),  // Note hierarchy and branch management
            new TemplateManagerTool(),    // Template system management and inheritance
            new ProtectedNoteTool(),      // Protected/encrypted note handling
            new NoteTypeConverterTool(),  // Convert notes between different types
            new RevisionManagerTool(),    // Note revision history and version control
            
            // Individual search tools (kept for backwards compatibility but lower priority)
            new SearchNotesTool(),        // Semantic search
            new KeywordSearchTool(),      // Keyword-based search
            new AttributeSearchTool(),    // Attribute-specific search
            
            // Other discovery tools
            new SearchSuggestionTool(),   // Search syntax helper

            // Note creation and manipulation tools
            new NoteCreationTool(),       // Create new notes
            new NoteUpdateTool(),         // Update existing notes
            new NoteSummarizationTool(),  // Summarize note content

            // Attribute and relationship tools
            new AttributeManagerTool(),   // Manage note attributes
            new RelationshipTool(),       // Manage note relationships

            // Content analysis tools
            new ContentExtractionTool(),  // Extract info from note content
            new CalendarIntegrationTool(), // Calendar-related operations

            // Helper tools
            new ToolDiscoveryHelper(),    // Tool discovery and usage guidance
        ];

        // Register all tools with smart parameter processing
        log.info('Applying smart parameter processing to all tools...');
        
        for (const tool of tools) {
            const toolName = tool.definition.function.name;
            
            // Create smart wrapper with tool-specific context
            const smartTool = createSmartTool(tool, {
                ...processingContext,
                toolName
            });
            
            // Register the smart-wrapped tool
            toolRegistry.registerTool(smartTool);
            
            // Also register with smart tool registry for advanced management
            smartToolRegistry.register(tool, processingContext);
            
            log.info(`Registered smart tool: ${toolName}`);
        }

        // Log initialization results
        const toolCount = toolRegistry.getAllTools().length;
        const toolNames = toolRegistry.getAllTools().map(tool => tool.definition.function.name).join(', ');
        
        log.info(`Successfully registered ${toolCount} LLM tools with smart processing: ${toolNames}`);
        
        // Log smart processing capabilities
        const smartStats = smartToolRegistry.getStats();
        log.info(`Smart parameter processing enabled for ${smartStats.totalTools} tools with features:`);
        log.info('  - Fuzzy note ID matching (title → noteId conversion)');
        log.info('  - Intelligent type coercion (string → number/boolean/array)');
        log.info('  - Enum fuzzy matching with typo tolerance');
        log.info('  - Context-aware parameter guessing');
        log.info('  - Automatic error correction with suggestions');
        log.info('  - Performance caching for repeated operations');
        
    } catch (error: unknown) {
        const errorMessage = isError(error) ? error.message : String(error);
        log.error(`Error initializing LLM tools: ${errorMessage}`);
        // Don't throw, just log the error to prevent breaking the pipeline
    }
}

export default {
    initializeTools
};
