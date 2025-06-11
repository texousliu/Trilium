/**
 * Attribute Search Tool
 *
 * This tool allows the LLM to search for notes based specifically on attributes.
 * It's specialized for finding notes with specific labels or relations.
 */

import type { Tool, ToolHandler } from './tool_interfaces.js';
import log from '../../log.js';
import attributes from '../../attributes.js';
import searchService from '../../search/services/search.js';
import attributeFormatter from '../../attribute_formatter.js';
import type BNote from '../../../becca/entities/bnote.js';

/**
 * Definition of the attribute search tool
 */
export const attributeSearchToolDefinition: Tool = {
    type: 'function',
    function: {
        name: 'attribute_search',
        description: `ATTRIBUTE-BASED search for notes. Find notes by their labels or relations (metadata/tags).
        
        BEST FOR: Finding notes by categories, tags, status, relationships, or other metadata
        USE WHEN: You need notes with specific labels, relations, or organizational attributes
        DIFFERENT FROM: search_notes (content) and keyword_search_notes (text)
        
        CRITICAL: attributeType MUST be exactly "label" or "relation" (lowercase only!)
        
        COMMON ATTRIBUTES:
        • Labels: #important, #todo, #project, #status, #priority
        • Relations: ~relatedTo, ~childOf, ~contains, ~references
        
        NEXT STEPS: Use read_note with returned noteId values for full content`,
        parameters: {
            type: 'object',
            properties: {
                attributeType: {
                    type: 'string',
                    description: `MUST be exactly "label" or "relation" (lowercase only!)
                    
                    CORRECT: "label", "relation"
                    WRONG: "Label", "LABEL", "labels", "relations"
                    
                    • "label" = tags/categories like #important, #todo
                    • "relation" = connections like ~relatedTo, ~childOf`,
                    enum: ['label', 'relation']
                },
                attributeName: {
                    type: 'string',
                    description: `Name of the attribute to search for.
                    
                    LABEL EXAMPLES:
                    - "important" (finds notes with #important)
                    - "status" (finds notes with #status label)
                    - "project" (finds notes tagged #project)
                    
                    RELATION EXAMPLES:
                    - "relatedTo" (finds notes with ~relatedTo relation)
                    - "childOf" (finds notes with ~childOf relation)
                    - "contains" (finds notes with ~contains relation)`
                },
                attributeValue: {
                    type: 'string',
                    description: `OPTIONAL: Specific value of the attribute.
                    
                    • Leave empty to find ALL notes with this attribute
                    • Specify value to find notes where attribute = specific value
                    
                    EXAMPLES:
                    - attributeName: "status", attributeValue: "completed"
                    - attributeName: "priority", attributeValue: "high"`
                },
                maxResults: {
                    type: 'number',
                    description: 'Number of results (1-50, default: 20). Use higher values for comprehensive searches.'
                }
            },
            required: ['attributeType', 'attributeName']
        }
    }
};

/**
 * Attribute search tool implementation
 */
export class AttributeSearchTool implements ToolHandler {
    public definition: Tool = attributeSearchToolDefinition;

    /**
     * Execute the attribute search tool
     */
    public async execute(args: { attributeType: string, attributeName: string, attributeValue?: string, maxResults?: number }): Promise<string | object> {
        try {
            const { attributeType, attributeName, attributeValue, maxResults = 20 } = args;

            log.info(`Executing attribute_search tool - Type: "${attributeType}", Name: "${attributeName}", Value: "${attributeValue || 'any'}", MaxResults: ${maxResults}`);

            // Enhanced validation with helpful guidance
            if (attributeType !== 'label' && attributeType !== 'relation') {
                const suggestions: string[] = [];
                
                if (attributeType.toLowerCase() === 'label' || attributeType.toLowerCase() === 'relation') {
                    suggestions.push(`CASE SENSITIVE: Use "${attributeType.toLowerCase()}" (lowercase)`);
                }
                
                if (attributeType.includes('label') || attributeType.includes('Label')) {
                    suggestions.push('CORRECT: Use "label" for tags and categories');
                }
                
                if (attributeType.includes('relation') || attributeType.includes('Relation')) {
                    suggestions.push('CORRECT: Use "relation" for connections and relationships');
                }
                
                const errorMessage = `Invalid attributeType: "${attributeType}"

REQUIRED: Must be exactly "label" or "relation" (lowercase only!)

${suggestions.length > 0 ? suggestions.join('\n') : ''}

EXAMPLES:
• Find notes with #important tag: { "attributeType": "label", "attributeName": "important" }
• Find notes with ~relatedTo relation: { "attributeType": "relation", "attributeName": "relatedTo" }`;
                
                return errorMessage;
            }

            // Execute the search
            log.info(`Searching for notes with ${attributeType}: ${attributeName}${attributeValue ? ' = ' + attributeValue : ''}`);
            const searchStartTime = Date.now();

            let results: BNote[] = [];

            if (attributeType === 'label') {
                // For labels, we can use the existing getNotesWithLabel function
                results = attributes.getNotesWithLabel(attributeName, attributeValue);
            } else {
                // For relations, we need to build a search query
                const query = attributeFormatter.formatAttrForSearch({
                    type: "relation",
                    name: attributeName,
                    value: attributeValue
                }, attributeValue !== undefined);

                results = searchService.searchNotes(query, {
                    includeArchivedNotes: true,
                    ignoreHoistedNote: true
                });
            }

            // Limit results
            const limitedResults = results.slice(0, maxResults);

            const searchDuration = Date.now() - searchStartTime;

            log.info(`Attribute search completed in ${searchDuration}ms, found ${results.length} matching notes, returning ${limitedResults.length}`);

            if (limitedResults.length > 0) {
                // Log top results
                limitedResults.slice(0, 3).forEach((note: BNote, index: number) => {
                    log.info(`Result ${index + 1}: "${note.title}"`);
                });
            } else {
                log.info(`No notes found with ${attributeType} "${attributeName}"${attributeValue ? ' = ' + attributeValue : ''}`);
            }

            // Format the results
            return {
                count: limitedResults.length,
                totalFound: results.length,
                attributeType,
                attributeName,
                attributeValue,
                results: limitedResults.map((note: BNote) => {
                    // Get relevant attributes of this type
                    const relevantAttributes = note.getOwnedAttributes()
                        .filter(attr => attr.type === attributeType && attr.name === attributeName)
                        .map(attr => ({
                            type: attr.type,
                            name: attr.name,
                            value: attr.value
                        }));

                    // Get a preview of the note content
                    let contentPreview = '';
                    try {
                        const content = note.getContent();
                        if (typeof content === 'string') {
                            contentPreview = content.length > 150 ? content.substring(0, 150) + '...' : content;
                        } else if (Buffer.isBuffer(content)) {
                            contentPreview = '[Binary content]';
                        } else {
                            contentPreview = String(content).substring(0, 150) + (String(content).length > 150 ? '...' : '');
                        }
                    } catch (_) {
                        contentPreview = '[Content not available]';
                    }

                    return {
                        noteId: note.noteId,
                        title: note.title,
                        preview: contentPreview,
                        relevantAttributes: relevantAttributes,
                        type: note.type,
                        dateCreated: note.dateCreated,
                        dateModified: note.dateModified
                    };
                })
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error(`Error executing attribute_search tool: ${errorMessage}`);
            return `Error: ${errorMessage}`;
        }
    }
}
