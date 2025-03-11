/**
 * Contains functions for semantic context extraction
 * Uses more intelligent methods to determine relevant context
 */

import { sanitizeHtmlContent } from './note_content.js';
import becca from '../../../becca/becca.js';
import { getNoteContent } from './note_content.js';

/**
 * Options for semantic context extraction
 */
export interface SemanticContextOptions {
    /**
     * Maximum number of similar notes to include
     */
    maxSimilarNotes?: number;

    /**
     * Whether to include note content snippets
     */
    includeContent?: boolean;

    /**
     * Maximum length of content snippets
     */
    snippetLength?: number;

    /**
     * Minimum similarity score (0-1) to include a note
     */
    minSimilarity?: number;
}

/**
 * Default options for semantic context extraction
 */
const DEFAULT_SEMANTIC_CONTEXT_OPTIONS: Required<SemanticContextOptions> = {
    maxSimilarNotes: 5,
    includeContent: true,
    snippetLength: 200,
    minSimilarity: 0.7
};

/**
 * Retrieve semantically similar notes to provide context
 * This is a simplified version without vector store integration
 * Use vector_store for actual semantic search
 */
export async function getSemanticContext(
    noteId: string,
    options: SemanticContextOptions = {}
): Promise<string> {
    // Merge provided options with defaults
    const config: Required<SemanticContextOptions> = {
        ...DEFAULT_SEMANTIC_CONTEXT_OPTIONS,
        ...options
    };

    try {
        // Get the current note
        const note = becca.getNote(noteId);

        if (!note) {
            return "Note not found.";
        }

        // Get note content for comparison
        const noteContent = await getNoteContent(noteId);

        if (!noteContent) {
            return "No content available for similarity comparison.";
        }

        // Get potential related notes (simplified method)
        // In real implementation, this would use vector_store.similarity methods
        const relatedNotes = await findRelatedNotes(noteId, noteContent, config);

        // Format the semantic context result
        let context = `Semantically related notes to "${note.title}":\n\n`;

        if (relatedNotes.length === 0) {
            context += "No semantically similar notes found.";
            return context;
        }

        // Add each related note to the context
        for (const relatedNote of relatedNotes) {
            context += `## ${relatedNote.title}\n`;

            if (config.includeContent && relatedNote.snippet) {
                context += `${relatedNote.snippet}\n\n`;
            }
        }

        return context;
    } catch (error) {
        console.error(`Error getting semantic context for ${noteId}:`, error);
        return "Error retrieving semantic context.";
    }
}

/**
 * Find related notes based on simple heuristics
 * This is a placeholder for semantic search that would normally use vector embeddings
 */
async function findRelatedNotes(
    noteId: string,
    noteContent: string,
    options: Required<SemanticContextOptions>
): Promise<{ id: string, title: string, snippet: string | null, score: number }[]> {
    const results: { id: string, title: string, snippet: string | null, score: number }[] = [];
    const note = becca.getNote(noteId);

    if (!note) {
        return results;
    }

    // 1. Check siblings (notes with the same parent)
    const parentBranches = note.getParentBranches();
    const processedNotes = new Set<string>();
    processedNotes.add(noteId); // Don't include the current note

    // Process parent branches to find siblings
    for (const branch of parentBranches) {
        if (!branch.parentNote) {
            continue;
        }

        const parentNote = branch.parentNote;
        const siblingNotes = parentNote.getChildNotes().filter(n => n.noteId !== noteId);

        for (const siblingNote of siblingNotes) {
            if (processedNotes.has(siblingNote.noteId)) {
                continue;
            }

            processedNotes.add(siblingNote.noteId);

            const siblingContent = await getNoteContent(siblingNote.noteId);
            if (!siblingContent) {
                continue;
            }

            // Calculate a very simple similarity score
            const score = calculateSimpleTextSimilarity(noteContent, siblingContent);

            if (score >= options.minSimilarity) {
                results.push({
                    id: siblingNote.noteId,
                    title: siblingNote.title,
                    snippet: siblingContent.substring(0, options.snippetLength) + '...',
                    score
                });
            }
        }
    }

    // 2. Check notes connected by relations
    const relations = note.getRelations();
    for (const relation of relations) {
        const targetNoteId = relation.value;

        if (!targetNoteId || processedNotes.has(targetNoteId)) {
            continue;
        }

        processedNotes.add(targetNoteId);

        const targetNote = becca.getNote(targetNoteId);
        if (!targetNote) {
            continue;
        }

        const targetContent = await getNoteContent(targetNoteId);
        if (!targetContent) {
            continue;
        }

        // Relations are already semantically connected, so give them a boost
        const score = calculateSimpleTextSimilarity(noteContent, targetContent) + 0.2;

        results.push({
            id: targetNoteId,
            title: targetNote.title,
            snippet: targetContent.substring(0, options.snippetLength) + '...',
            score: Math.min(score, 1.0) // Cap at 1.0
        });
    }

    // Sort by similarity score (highest first) and limit
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, options.maxSimilarNotes);
}

/**
 * Calculate a simple text similarity based on shared words
 * This is a very basic implementation and should be replaced with actual embedding similarity
 */
function calculateSimpleTextSimilarity(text1: string, text2: string): number {
    // Clean and tokenize the texts
    const cleanText1 = sanitizeHtmlContent(text1).toLowerCase();
    const cleanText2 = sanitizeHtmlContent(text2).toLowerCase();

    // Get unique words (case insensitive)
    const words1 = new Set(cleanText1.split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(cleanText2.split(/\W+/).filter(w => w.length > 3));

    // No meaningful comparison possible if either text has no significant words
    if (words1.size === 0 || words2.size === 0) {
        return 0;
    }

    // Count shared words
    let sharedCount = 0;
    for (const word of words1) {
        if (words2.has(word)) {
            sharedCount++;
        }
    }

    // Jaccard similarity: intersection size / union size
    return sharedCount / (words1.size + words2.size - sharedCount);
}
