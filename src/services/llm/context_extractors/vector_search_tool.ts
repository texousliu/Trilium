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
import { VectorSearchStage } from '../pipeline/stages/vector_search_stage.js';
import type { ContextService } from '../context/modules/context_service.js';

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

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  includeContent?: boolean;
}

export class VectorSearchTool {
  private contextService: any = null;
  private maxResults: number = 5;
  private vectorSearchStage: VectorSearchStage;

  constructor() {
    // Initialize the vector search stage
    this.vectorSearchStage = new VectorSearchStage();
    log.info('VectorSearchTool initialized with VectorSearchStage pipeline component');
  }

  /**
   * Set the context service for performing vector searches
   */
  setContextService(contextService: any): void {
    this.contextService = contextService;
    log.info('Context service set in VectorSearchTool');
  }

  /**
   * Perform a vector search for related notes
   */
  async search(
    query: string,
    contextNoteId?: string,
    searchOptions: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      // Set more aggressive defaults to return more content
      const options = {
        maxResults: searchOptions.limit || 15, // Increased from default
        threshold: searchOptions.threshold || 0.5, // Lower threshold to include more results
        useEnhancedQueries: true, // Enable query enhancement by default
        includeContent: searchOptions.includeContent !== undefined ? searchOptions.includeContent : true,
        ...searchOptions
      };

      log.info(`Vector search: "${query.substring(0, 50)}..." with limit=${options.maxResults}, threshold=${options.threshold}`);

      // Use the pipeline stage for vector search
      const result = await this.vectorSearchStage.execute({
        query,
        noteId: contextNoteId || null,
        options: {
          maxResults: options.maxResults,
          threshold: options.threshold,
          useEnhancedQueries: options.useEnhancedQueries
        }
      });
      
      const searchResults = result.searchResults;
      log.info(`Vector search found ${searchResults.length} relevant notes via pipeline`);

      // If includeContent is true but we're missing content for some notes, fetch it
      if (options.includeContent) {
        for (let i = 0; i < searchResults.length; i++) {
          const result = searchResults[i];
          try {
            // Get content if missing
            if (!result.content) {
              const noteContent = await import('../context/note_content.js');
              const content = await noteContent.getNoteContent(result.noteId);
              if (content) {
                result.content = content.substring(0, 2000); // Limit to 2000 chars
                log.info(`Added direct content for note ${result.noteId}, length: ${result.content.length} chars`);
              }
            }
          } catch (error) {
            log.error(`Error getting content for note ${result.noteId}: ${error}`);
          }
        }
      }

      // Format results to match the expected VectorSearchResult interface
      return searchResults.map(note => ({
        noteId: note.noteId,
        title: note.title,
        contentPreview: note.content 
          ? note.content.length > 200
            ? note.content.substring(0, 200) + '...'
            : note.content
          : 'No content available',
        similarity: note.similarity,
        parentId: note.parentId
      }));
    } catch (error) {
      log.error(`Vector search error: ${error}`);
      return [];
    }
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
      // Set defaults
      const maxResults = options.maxResults || this.maxResults;
      const threshold = options.similarityThreshold || 0.6;
      const parentNoteId = options.parentNoteId || null;

      // Use the pipeline for consistent search behavior
      const result = await this.vectorSearchStage.execute({
        query,
        noteId: parentNoteId,
        options: {
          maxResults,
          threshold,
          useEnhancedQueries: true
        }
      });

      // Format results to match the expected interface
      return result.searchResults.map(result => ({
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