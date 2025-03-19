/**
 * Vector Search Tool
 *
 * This tool enables the LLM agent to perform semantic vector-based searches
 * over the content in the notes database. It handles:
 * - Finding semantically related notes to a query
 * - Extracting relevant sections from notes
 * - Providing relevant context for LLM to generate accurate responses
 *
 * The tool uses embeddings to find notes with similar semantic meaning,
 * allowing the LLM to find relevant information even when exact keywords
 * are not present.
 */

import log from '../../log.js';

// Define interface for semantic context service to avoid circular imports
interface ISemanticContextService {
  semanticSearch(query: string, options: any): Promise<any[]>;
  semanticSearchChunks(query: string, options: any): Promise<any[]>;
}

export interface VectorSearchResult {
  noteId: string;
  title: string;
  contentPreview: string;
  similarity: number;
  parentId?: string;
  dateCreated?: string;
  dateModified?: string;
}

export interface SearchResultItem {
  noteId: string;
  noteTitle: string;
  contentPreview: string;
  similarity: number;
  parentId?: string;
  dateCreated?: string;
  dateModified?: string;
}

export interface ChunkSearchResultItem {
  noteId: string;
  noteTitle: string;
  chunk: string;
  similarity: number;
  parentId?: string;
}

export class VectorSearchTool {
  private semanticContext: ISemanticContextService | null = null;
  private maxResults: number = 5;

  constructor() {
    // The semantic context will be set later via setSemanticContext
  }

  /**
   * Set the semantic context service instance
   */
  setSemanticContext(semanticContext: ISemanticContextService): void {
    this.semanticContext = semanticContext;
  }

  /**
   * Search for notes semantically related to a query
   */
  async searchNotes(query: string, options: {
    parentNoteId?: string,
    maxResults?: number,
    similarityThreshold?: number
  } = {}): Promise<VectorSearchResult[]> {
    try {
      if (!this.semanticContext) {
        throw new Error("Semantic context service not set. Call setSemanticContext() first.");
      }

      if (!query || query.trim().length === 0) {
        return [];
      }

      const maxResults = options.maxResults || this.maxResults;
      const similarityThreshold = options.similarityThreshold || 0.65; // Default threshold
      const parentNoteId = options.parentNoteId; // Optional filtering by parent

      // Search notes using the semantic context service
      const results = await this.semanticContext.semanticSearch(query, {
        maxResults,
        similarityThreshold,
        ancestorNoteId: parentNoteId
      });

      if (!results || results.length === 0) {
        return [];
      }

      // Transform results to the tool's format
      return results.map((result: SearchResultItem) => ({
        noteId: result.noteId,
        title: result.noteTitle,
        contentPreview: result.contentPreview,
        similarity: result.similarity,
        parentId: result.parentId,
        dateCreated: result.dateCreated,
        dateModified: result.dateModified
      }));
    } catch (error: any) {
      log.error(`Error in vector search: ${error.message}`);
      return [];
    }
  }

  /**
   * Search for content chunks within notes that are semantically related to a query
   */
  async searchContentChunks(query: string, options: {
    noteId?: string,
    maxResults?: number,
    similarityThreshold?: number
  } = {}): Promise<VectorSearchResult[]> {
    try {
      if (!this.semanticContext) {
        throw new Error("Semantic context service not set. Call setSemanticContext() first.");
      }

      if (!query || query.trim().length === 0) {
        return [];
      }

      const maxResults = options.maxResults || this.maxResults;
      const similarityThreshold = options.similarityThreshold || 0.70; // Higher threshold for chunks
      const noteId = options.noteId; // Optional filtering by specific note

      // Search content chunks using the semantic context service
      const results = await this.semanticContext.semanticSearchChunks(query, {
        maxResults,
        similarityThreshold,
        noteId
      });

      if (!results || results.length === 0) {
        return [];
      }

      // Transform results to the tool's format
      return results.map((result: ChunkSearchResultItem) => ({
        noteId: result.noteId,
        title: result.noteTitle,
        contentPreview: result.chunk, // Use the chunk content as preview
        similarity: result.similarity,
        parentId: result.parentId
      }));
    } catch (error: any) {
      log.error(`Error in content chunk search: ${error.message}`);
      return [];
    }
  }

  /**
   * Elaborate on why certain results were returned for a query
   */
  explainResults(query: string, results: VectorSearchResult[]): string {
    if (!query || !results || results.length === 0) {
      return "No results to explain.";
    }

    let explanation = `For query "${query}", I found these semantically related notes:\n\n`;

    results.forEach((result, index) => {
      explanation += `${index + 1}. "${result.title}" (similarity: ${(result.similarity * 100).toFixed(1)}%)\n`;
      explanation += `   Preview: ${result.contentPreview.substring(0, 150)}...\n`;

      if (index < results.length - 1) {
        explanation += "\n";
      }
    });

    explanation += "\nThese results were found based on semantic similarity rather than just keyword matching.";

    return explanation;
  }
}

export default VectorSearchTool;
