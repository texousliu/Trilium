/**
 * Note Creation Tool
 *
 * This tool allows the LLM to create new notes in Trilium.
 */

import type { Tool, ToolHandler } from './tool_interfaces.js';
import log from '../../log.js';
import becca from '../../../becca/becca.js';
import notes from '../../notes.js';

/**
 * Definition of the note creation tool
 */
export const noteCreationToolDefinition: Tool = {
    type: 'function',
    function: {
        name: 'create_note',
        description: 'Create a new note in Trilium with the specified content and attributes',
        parameters: {
            type: 'object',
            properties: {
                parentNoteId: {
                    type: 'string',
                    description: 'ID of the parent note under which to create the new note. If not specified, creates under root.'
                },
                title: {
                    type: 'string',
                    description: 'Title of the new note'
                },
                content: {
                    type: 'string',
                    description: 'Content of the new note'
                },
                type: {
                    type: 'string',
                    description: 'Type of the note (text, code, etc.)',
                    enum: ['text', 'code', 'file', 'image', 'search', 'relation-map', 'book', 'mermaid', 'canvas']
                },
                mime: {
                    type: 'string',
                    description: 'MIME type of the note (e.g., text/html, application/json). Only required for certain note types.'
                },
                attributes: {
                    type: 'array',
                    description: 'Array of attributes to set on the note (e.g., [{"name":"#tag"}, {"name":"priority", "value":"high"}])',
                    items: {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                description: 'Name of the attribute'
                            },
                            value: {
                                type: 'string',
                                description: 'Value of the attribute (if applicable)'
                            }
                        }
                    }
                }
            },
            required: ['title', 'content']
        }
    }
};

/**
 * Note creation tool implementation
 */
export class NoteCreationTool implements ToolHandler {
    public definition: Tool = noteCreationToolDefinition;

    /**
     * Execute the note creation tool
     */
    public async execute(args: {
        parentNoteId?: string,
        title: string,
        content: string,
        type?: string,
        mime?: string,
        attributes?: Array<{ name: string, value?: string }>
    }): Promise<string | object> {
        try {
            const { parentNoteId, title, content, type = 'text', mime } = args;

            log.info(`Executing create_note tool - Title: "${title}", Type: ${type}, ParentNoteId: ${parentNoteId || 'root'}`);

            // Validate parent note exists if specified
            let parent;
            if (parentNoteId) {
                parent = becca.notes[parentNoteId];
                if (!parent) {
                    return `Error: Parent note with ID ${parentNoteId} not found. Please specify a valid parent note ID.`;
                }
            } else {
                // Use root note if no parent specified
                parent = becca.getNote('root');
            }

            // Determine the appropriate mime type
            let noteMime = mime;
            if (!noteMime) {
                // Set default mime types based on note type
                switch (type) {
                    case 'text':
                        noteMime = 'text/html';
                        break;
                    case 'code':
                        noteMime = 'text/plain';
                        break;
                    case 'file':
                        noteMime = 'application/octet-stream';
                        break;
                    case 'image':
                        noteMime = 'image/png';
                        break;
                    default:
                        noteMime = 'text/html';
                }
            }

            // Create the note
            const createStartTime = Date.now();
            const noteId = await notes.createNewNote({
                parentNoteId: parent.noteId,
                title: title,
                content: content,
                type: type,
                mime: noteMime
            });
            const createDuration = Date.now() - createStartTime;

            if (!noteId) {
                return 'Error: Failed to create note. An unknown error occurred.';
            }

            log.info(`Note created successfully in ${createDuration}ms, ID: ${noteId}`);

            // Add attributes if specified
            if (args.attributes && args.attributes.length > 0) {
                log.info(`Adding ${args.attributes.length} attributes to the note`);

                for (const attr of args.attributes) {
                    if (!attr.name) continue;

                    const attrStartTime = Date.now();
                    await notes.createAttribute(noteId, attr.name, attr.value || '');
                    const attrDuration = Date.now() - attrStartTime;

                    log.info(`Added attribute ${attr.name}=${attr.value || ''} in ${attrDuration}ms`);
                }
            }

            // Return the new note's information
            const newNote = becca.notes[noteId];

            return {
                success: true,
                noteId: noteId,
                title: newNote.title,
                type: newNote.type,
                message: `Note "${title}" created successfully`
            };
        } catch (error: any) {
            log.error(`Error executing create_note tool: ${error.message || String(error)}`);
            return `Error: ${error.message || String(error)}`;
        }
    }
}
