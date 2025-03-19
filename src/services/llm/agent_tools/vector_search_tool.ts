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

// Define interface for context service to avoid circular imports
interface IContextService {
  findRelevantNotesMultiQuery(queries: string[], contextNoteId: string | null, limit: number): Promise<any[]>;
  processQuery(userQuestion: string, llmService: any, contextNoteId: string | null, showThinking: boolean): Promise<any>;
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
  private contextService: IContextService | null = null;
  private maxResults: number = 5;

  constructor() {
    // Initialization is done by setting context service
  }

  /**
   * Set the context service for performing vector searches
   */
  setContextService(contextService: IContextService): void {
    this.contextService = contextService;
    log.info('Context service set in VectorSearchTool');
  }

  /**
   * Search for notes that are semantically related to the query
   */
  async searchNotes(query: string, options: {
    parentNoteId?: string,
    maxResults?: number,
    similarityThreshold?: number
  } = {}): Promise<VectorSearchResult[]> {
    try {
      // Validate contextService is set
      if (!this.contextService) {
        log.error('Context service not set in VectorSearchTool');
        return [];
      }

      // Set defaults
      const maxResults = options.maxResults || this.maxResults;
      const parentNoteId = options.parentNoteId || null;

      // Use multi-query approach for more robust results
      const queries = [query];
      const results = await this.contextService.findRelevantNotesMultiQuery(
        queries,
        parentNoteId,
        maxResults
      );

      // Format results to match the expected interface
      return results.map(result => ({
        noteId: result.noteId,
        title: result.title,
        contentPreview: result.content ?
          (result.content.length > 200 ?
            result.content.substring(0, 200) + '...' :
            result.content)
          : 'No content available',
        similarity: result.similarity,
        parentId: result.parentId
      }));
    } catch (error) {
      log.error(`Error in vector search: ${error}`);
      return [];
    }
  }

  /**
   * Search for content chunks that are semantically related to the query
   */
  async searchContentChunks(query: string, options: {
    noteId?: string,
    maxResults?: number,
    similarityThreshold?: number
  } = {}): Promise<VectorSearchResult[]> {
    try {
      // For now, use the same implementation as searchNotes,
      // but in the future we'll implement chunk-based search
      return this.searchNotes(query, {
        parentNoteId: options.noteId,
        maxResults: options.maxResults,
        similarityThreshold: options.similarityThreshold
      });
    } catch (error) {
      log.error(`Error in vector chunk search: ${error}`);
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
