/**
 * Note Structure Navigator Tool
 *
 * This tool enables the LLM agent to navigate through the hierarchical
 * structure of notes in the knowledge base. It provides methods for:
 * - Finding paths between notes
 * - Exploring parent-child relationships
 * - Discovering note attributes and metadata
 * - Understanding the context of a note within the broader structure
 *
 * This helps the LLM agent provide more accurate and contextually relevant responses.
 */

import becca from '../../../becca/becca.js';
import log from '../../log.js';
import type BNote from '../../../becca/entities/bnote.js';
import type BAttribute from '../../../becca/entities/battribute.js';

export interface NoteInfo {
  noteId: string;
  title: string;
  type: string;
  mime?: string;
  dateCreated?: string;
  dateModified?: string;
  isProtected: boolean;
  isArchived: boolean;
  attributeNames: string[];
  hasChildren: boolean;
}

export interface NotePathInfo {
  notePath: string[];
  notePathTitles: string[];
}

export interface NoteHierarchyLevel {
  noteId: string;
  title: string;
  level: number;
  children?: NoteHierarchyLevel[];
}

export class NoteNavigatorTool {
  private maxPathLength: number = 20;
  private maxBreadth: number = 100;
  private maxDepth: number = 5;

  /**
   * Get detailed information about a note
   */
  getNoteInfo(noteId: string): NoteInfo | null {
    try {
      const note = becca.notes[noteId];
      if (!note) {
        return null;
      }

      // Get attribute names for this note
      const attributeNames = note.ownedAttributes
        .map(attr => attr.name)
        .filter((value, index, self) => self.indexOf(value) === index); // unique values

      return {
        noteId: note.noteId,
        title: note.title,
        type: note.type,
        mime: note.mime,
        dateCreated: note.dateCreated,
        dateModified: note.dateModified,
        isProtected: note.isProtected ?? false,
        isArchived: note.isArchived || false,
        attributeNames,
        hasChildren: note.children.length > 0
      };
    } catch (error: any) {
      log.error(`Error getting note info: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all paths to a note from the root
   */
  getNotePathsFromRoot(noteId: string): NotePathInfo[] {
    try {
      const note = becca.notes[noteId];
      if (!note) {
        return [];
      }

      // Get all possible paths to this note
      const allPaths = note.getAllNotePaths();
      if (!allPaths || allPaths.length === 0) {
        return [];
      }

      // Convert path IDs to titles
      return allPaths.map(path => {
        const titles = path.map(id => {
          const pathNote = becca.notes[id];
          return pathNote ? pathNote.title : id;
        });

        return {
          notePath: path,
          notePathTitles: titles
        };
      }).sort((a, b) => a.notePath.length - b.notePath.length); // Sort by path length, shortest first
    } catch (error: any) {
      log.error(`Error getting note paths: ${error.message}`);
      return [];
    }
  }

  /**
   * Get the parent notes of a given note
   */
  getParentNotes(noteId: string): NoteInfo[] {
    try {
      const note = becca.notes[noteId];
      if (!note || !note.parents) {
        return [];
      }

      return note.parents
        .map(parent => this.getNoteInfo(parent.noteId))
        .filter((info): info is NoteInfo => info !== null);
    } catch (error: any) {
      log.error(`Error getting parent notes: ${error.message}`);
      return [];
    }
  }

  /**
   * Get the children notes of a given note
   */
  getChildNotes(noteId: string, maxChildren: number = this.maxBreadth): NoteInfo[] {
    try {
      const note = becca.notes[noteId];
      if (!note || !note.children) {
        return [];
      }

      return note.children
        .slice(0, maxChildren)
        .map(child => this.getNoteInfo(child.noteId))
        .filter((info): info is NoteInfo => info !== null);
    } catch (error: any) {
      log.error(`Error getting child notes: ${error.message}`);
      return [];
    }
  }

  /**
   * Get a note's hierarchy (children up to specified depth)
   * This is useful for the LLM to understand the structure within a note's subtree
   */
  getNoteHierarchy(noteId: string, depth: number = 2): NoteHierarchyLevel | null {
    if (depth < 0 || depth > this.maxDepth) {
      depth = this.maxDepth;
    }

    try {
      const note = becca.notes[noteId];
      if (!note) {
        return null;
      }

      const result: NoteHierarchyLevel = {
        noteId: note.noteId,
        title: note.title,
        level: 0
      };

      // Recursively get children if depth allows
      if (depth > 0 && note.children.length > 0) {
        result.children = note.children
          .slice(0, this.maxBreadth)
          .map(child => this._getHierarchyLevel(child.noteId, 1, depth))
          .filter((node): node is NoteHierarchyLevel => node !== null);
      }

      return result;
    } catch (error: any) {
      log.error(`Error getting note hierarchy: ${error.message}`);
      return null;
    }
  }

  /**
   * Recursive helper for getNoteHierarchy
   */
  private _getHierarchyLevel(noteId: string, currentLevel: number, maxDepth: number): NoteHierarchyLevel | null {
    try {
      const note = becca.notes[noteId];
      if (!note) {
        return null;
      }

      const result: NoteHierarchyLevel = {
        noteId: note.noteId,
        title: note.title,
        level: currentLevel
      };

      // Recursively get children if depth allows
      if (currentLevel < maxDepth && note.children.length > 0) {
        result.children = note.children
          .slice(0, this.maxBreadth)
          .map(child => this._getHierarchyLevel(child.noteId, currentLevel + 1, maxDepth))
          .filter((node): node is NoteHierarchyLevel => node !== null);
      }

      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get attributes of a note
   */
  getNoteAttributes(noteId: string): BAttribute[] {
    try {
      const note = becca.notes[noteId];
      if (!note) {
        return [];
      }

      return note.ownedAttributes;
    } catch (error: any) {
      log.error(`Error getting note attributes: ${error.message}`);
      return [];
    }
  }

  /**
   * Find the shortest path between two notes
   */
  findPathBetweenNotes(fromNoteId: string, toNoteId: string): NotePathInfo | null {
    try {
      if (fromNoteId === toNoteId) {
        const note = becca.notes[fromNoteId];
        if (!note) return null;

        return {
          notePath: [fromNoteId],
          notePathTitles: [note.title]
        };
      }

      // Simple breadth-first search to find shortest path
      const visited = new Set<string>();
      const queue: Array<{noteId: string, path: string[], titles: string[]}> = [];

      // Initialize with the starting note
      const startNote = becca.notes[fromNoteId];
      if (!startNote) return null;

      queue.push({
        noteId: fromNoteId,
        path: [fromNoteId],
        titles: [startNote.title]
      });

      visited.add(fromNoteId);

      while (queue.length > 0 && queue[0].path.length <= this.maxPathLength) {
        const {noteId, path, titles} = queue.shift()!;
        const note = becca.notes[noteId];

        if (!note) continue;

        // Get IDs of all connected notes (parents and children)
        const connections: string[] = [
          ...note.parents.map(p => p.noteId),
          ...note.children.map(c => c.noteId)
        ];

        for (const connectedId of connections) {
          if (visited.has(connectedId)) continue;

          const connectedNote = becca.notes[connectedId];
          if (!connectedNote) continue;

          const newPath = [...path, connectedId];
          const newTitles = [...titles, connectedNote.title];

          // Check if we found the target
          if (connectedId === toNoteId) {
            return {
              notePath: newPath,
              notePathTitles: newTitles
            };
          }

          // Continue BFS
          queue.push({
            noteId: connectedId,
            path: newPath,
            titles: newTitles
          });

          visited.add(connectedId);
        }
      }

      // No path found
      return null;
    } catch (error: any) {
      log.error(`Error finding path between notes: ${error.message}`);
      return null;
    }
  }

  /**
   * Search for notes by title
   */
  searchNotesByTitle(searchTerm: string, limit: number = 10): NoteInfo[] {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      searchTerm = searchTerm.toLowerCase();
      const results: NoteInfo[] = [];

      // Simple in-memory search through all notes
      for (const noteId in becca.notes) {
        if (results.length >= limit) break;

        const note = becca.notes[noteId];
        if (!note || note.isDeleted) continue;

        if (note.title.toLowerCase().includes(searchTerm)) {
          const info = this.getNoteInfo(noteId);
          if (info) results.push(info);
        }
      }

      return results;
    } catch (error: any) {
      log.error(`Error searching notes by title: ${error.message}`);
      return [];
    }
  }

  /**
   * Get clones of a note (if any)
   */
  getNoteClones(noteId: string): NoteInfo[] {
    try {
      const note = becca.notes[noteId];
      if (!note) {
        return [];
      }

      // A note has clones if it has multiple parents
      if (note.parents.length <= 1) {
        return [];
      }

      // Return parent notes, which represent different contexts for this note
      return this.getParentNotes(noteId);
    } catch (error: any) {
      log.error(`Error getting note clones: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate a readable overview of a note's position in the hierarchy
   * This is useful for the LLM to understand the context of a note
   */
  getNoteContextDescription(noteId: string): string {
    try {
      const note = becca.notes[noteId];
      if (!note) {
        return "Note not found.";
      }

      const paths = this.getNotePathsFromRoot(noteId);
      if (paths.length === 0) {
        return `Note "${note.title}" exists but has no path from root.`;
      }

      let result = "";

      // Basic note info
      result += `Note: "${note.title}" (${note.type})\n`;

      // Is it cloned?
      if (paths.length > 1) {
        result += `This note appears in ${paths.length} different locations:\n`;

        // Show max 3 paths to avoid overwhelming context
        for (let i = 0; i < Math.min(3, paths.length); i++) {
          const path = paths[i];
          result += `${i+1}. ${path.notePathTitles.join(' > ')}\n`;
        }

        if (paths.length > 3) {
          result += `... and ${paths.length - 3} more locations\n`;
        }
      } else {
        // Just one path
        const path = paths[0];
        result += `Path: ${path.notePathTitles.join(' > ')}\n`;
      }

      // Children info
      const children = this.getChildNotes(noteId, 5);
      if (children.length > 0) {
        result += `\nContains ${note.children.length} child notes`;
        if (children.length < note.children.length) {
          result += ` (showing first ${children.length})`;
        }
        result += `:\n`;

        for (const child of children) {
          result += `- ${child.title} (${child.type})\n`;
        }

        if (children.length < note.children.length) {
          result += `... and ${note.children.length - children.length} more\n`;
        }
      } else {
        result += "\nThis note has no child notes.\n";
      }

      // Attributes summary
      const attributes = this.getNoteAttributes(noteId);
      if (attributes.length > 0) {
        result += `\nNote has ${attributes.length} attributes.\n`;

        // Group attributes by name
        const attrMap: Record<string, string[]> = {};
        for (const attr of attributes) {
          if (!attrMap[attr.name]) {
            attrMap[attr.name] = [];
          }
          attrMap[attr.name].push(attr.value);
        }

        for (const [name, values] of Object.entries(attrMap)) {
          if (values.length === 1) {
            result += `- ${name}: ${values[0]}\n`;
          } else {
            result += `- ${name}: ${values.length} values\n`;
          }
        }
      }

      return result;
    } catch (error: any) {
      log.error(`Error getting note context: ${error.message}`);
      return "Error generating note context description.";
    }
  }
}

export default NoteNavigatorTool;
