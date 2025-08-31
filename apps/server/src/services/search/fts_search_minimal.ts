/**
 * Minimal FTS5 Search Service
 * 
 * Design principles:
 * - Direct SQLite FTS5 queries only
 * - No memory management or query governors
 * - No temporary tables or complex batching
 * - Let SQLite handle the scale
 * - Simple, maintainable code
 */

import sql from "../sql.js";
import log from "../log.js";

export interface MinimalFTSSearchResult {
    noteId: string;
    title: string;
    score: number;
    snippet?: string;
}

export interface MinimalFTSSearchOptions {
    limit?: number;
    offset?: number;
    includeSnippets?: boolean;
}

class MinimalFTSSearchService {
    private isFTS5Available: boolean | null = null;

    /**
     * Check if FTS5 table exists
     */
    checkFTS5Availability(): boolean {
        if (this.isFTS5Available !== null) {
            return this.isFTS5Available;
        }

        try {
            const tableExists = sql.getValue<number>(`
                SELECT COUNT(*) 
                FROM sqlite_master 
                WHERE type = 'table' 
                AND name = 'notes_fts'
            `);
            
            this.isFTS5Available = tableExists > 0;
            
            if (!this.isFTS5Available) {
                log.info("FTS5 table not found");
            }
        } catch (error) {
            log.error(`Error checking FTS5 availability: ${error}`);
            this.isFTS5Available = false;
        }

        return this.isFTS5Available;
    }

    /**
     * Convert search tokens to FTS5 query
     * Keep it simple - let SQLite do the work
     */
    convertToFTS5Query(tokens: string[], operator: string): string {
        if (!tokens || tokens.length === 0) {
            throw new Error("No search tokens provided");
        }

        // Basic sanitization - remove FTS5 special characters
        const sanitizedTokens = tokens.map(token => 
            token.replace(/["()]/g, '').trim()
        ).filter(t => t.length > 0);

        if (sanitizedTokens.length === 0) {
            throw new Error("No valid tokens after sanitization");
        }

        switch (operator) {
            case "=": // Exact phrase
                return `"${sanitizedTokens.join(" ")}"`;
            
            case "*=*": // Contains (substring)
                // Use prefix search for each token
                return sanitizedTokens.map(t => `${t}*`).join(" AND ");
            
            case "*=": // Ends with (not well supported in FTS5)
                // Fallback to contains
                return sanitizedTokens.map(t => `${t}*`).join(" AND ");
            
            case "=*": // Starts with
                return sanitizedTokens.map(t => `${t}*`).join(" AND ");
            
            case "!=": // Does not contain
                return `NOT (${sanitizedTokens.join(" OR ")})`;
            
            case "~=": // Fuzzy match (use OR for flexibility)
            case "~*":
                return sanitizedTokens.join(" OR ");
            
            default:
                // Default to AND search
                return sanitizedTokens.join(" AND ");
        }
    }

    /**
     * Perform word-based search using FTS5
     */
    searchWords(
        tokens: string[], 
        operator: string,
        noteIds?: Set<string>,
        options: MinimalFTSSearchOptions = {}
    ): MinimalFTSSearchResult[] {
        if (!this.checkFTS5Availability()) {
            throw new Error("FTS5 not available");
        }

        const {
            limit = 100,
            offset = 0,
            includeSnippets = false
        } = options;

        try {
            const ftsQuery = this.convertToFTS5Query(tokens, operator);
            
            // Build the query
            let query: string;
            const params: any[] = [ftsQuery];

            if (noteIds && noteIds.size > 0) {
                // Filter by specific noteIds
                const noteIdArray = Array.from(noteIds);
                const placeholders = noteIdArray.map(() => '?').join(',');
                
                if (includeSnippets) {
                    query = `
                        SELECT 
                            f.noteId,
                            n.title,
                            -rank as score,
                            snippet(notes_fts, 2, '<mark>', '</mark>', '...', 30) as snippet
                        FROM notes_fts f
                        INNER JOIN notes n ON f.noteId = n.noteId
                        WHERE notes_fts MATCH ?
                            AND f.noteId IN (${placeholders})
                            AND n.isDeleted = 0
                        ORDER BY rank
                        LIMIT ? OFFSET ?
                    `;
                } else {
                    query = `
                        SELECT 
                            f.noteId,
                            n.title,
                            -rank as score
                        FROM notes_fts f
                        INNER JOIN notes n ON f.noteId = n.noteId
                        WHERE notes_fts MATCH ?
                            AND f.noteId IN (${placeholders})
                            AND n.isDeleted = 0
                        ORDER BY rank
                        LIMIT ? OFFSET ?
                    `;
                }
                params.push(...noteIdArray, limit, offset);
            } else {
                // Search all notes
                if (includeSnippets) {
                    query = `
                        SELECT 
                            f.noteId,
                            n.title,
                            -rank as score,
                            snippet(notes_fts, 2, '<mark>', '</mark>', '...', 30) as snippet
                        FROM notes_fts f
                        INNER JOIN notes n ON f.noteId = n.noteId
                        WHERE notes_fts MATCH ?
                            AND n.isDeleted = 0
                        ORDER BY rank
                        LIMIT ? OFFSET ?
                    `;
                } else {
                    query = `
                        SELECT 
                            f.noteId,
                            n.title,
                            -rank as score
                        FROM notes_fts f
                        INNER JOIN notes n ON f.noteId = n.noteId
                        WHERE notes_fts MATCH ?
                            AND n.isDeleted = 0
                        ORDER BY rank
                        LIMIT ? OFFSET ?
                    `;
                }
                params.push(limit, offset);
            }

            const results = sql.getRows<MinimalFTSSearchResult>(query, params);
            return results;

        } catch (error: any) {
            log.error(`FTS5 search error: ${error}`);
            throw new Error(`FTS5 search failed: ${error.message}`);
        }
    }

    /**
     * Perform substring search using FTS5 prefix indexes
     * This is slower than word search but still uses FTS5
     */
    searchSubstring(
        tokens: string[],
        noteIds?: Set<string>,
        options: MinimalFTSSearchOptions = {}
    ): MinimalFTSSearchResult[] {
        if (!this.checkFTS5Availability()) {
            throw new Error("FTS5 not available");
        }

        const {
            limit = 100,
            offset = 0,
            includeSnippets = false
        } = options;

        try {
            // For substring search, use prefix matching
            // Split each token into smaller parts for better matching
            const substringTokens: string[] = [];
            
            for (const token of tokens) {
                if (token.length <= 2) {
                    // Short tokens - just add with wildcard
                    substringTokens.push(`${token}*`);
                } else {
                    // Longer tokens - create multiple prefix searches
                    // This leverages the prefix indexes we created (2, 3, 4 chars)
                    for (let i = 2; i <= Math.min(4, token.length); i++) {
                        substringTokens.push(`${token.substring(0, i)}*`);
                    }
                    // Also add the full token with wildcard
                    if (token.length > 4) {
                        substringTokens.push(`${token}*`);
                    }
                }
            }

            // Create FTS query with OR to find any matching substring
            const ftsQuery = substringTokens.join(" OR ");
            
            // Build the query
            let query: string;
            const params: any[] = [ftsQuery];

            if (noteIds && noteIds.size > 0) {
                const noteIdArray = Array.from(noteIds);
                const placeholders = noteIdArray.map(() => '?').join(',');
                
                query = `
                    SELECT DISTINCT
                        f.noteId,
                        n.title,
                        -rank as score
                    FROM notes_fts f
                    INNER JOIN notes n ON f.noteId = n.noteId
                    WHERE notes_fts MATCH ?
                        AND f.noteId IN (${placeholders})
                        AND n.isDeleted = 0
                    ORDER BY rank
                    LIMIT ? OFFSET ?
                `;
                params.push(...noteIdArray, limit, offset);
            } else {
                query = `
                    SELECT DISTINCT
                        f.noteId,
                        n.title,
                        -rank as score
                    FROM notes_fts f
                    INNER JOIN notes n ON f.noteId = n.noteId
                    WHERE notes_fts MATCH ?
                        AND n.isDeleted = 0
                    ORDER BY rank
                    LIMIT ? OFFSET ?
                `;
                params.push(limit, offset);
            }

            const results = sql.getRows<MinimalFTSSearchResult>(query, params);
            return results;

        } catch (error: any) {
            log.error(`FTS5 substring search error: ${error}`);
            throw new Error(`FTS5 substring search failed: ${error.message}`);
        }
    }

    /**
     * Combined search that handles both word and substring searches
     */
    search(
        tokens: string[],
        operator: string,
        noteIds?: Set<string>,
        options: MinimalFTSSearchOptions = {}
    ): MinimalFTSSearchResult[] {
        // Substring search operators
        if (operator === '*=*' || operator === '*=') {
            return this.searchSubstring(tokens, noteIds, options);
        }
        
        // Word-based search for all other operators
        return this.searchWords(tokens, operator, noteIds, options);
    }

    /**
     * Update FTS index for a specific note
     */
    updateNoteIndex(noteId: string, title: string, content: string): void {
        if (!this.checkFTS5Availability()) {
            return;
        }

        try {
            sql.transactional(() => {
                // Delete existing entry
                sql.execute(`DELETE FROM notes_fts WHERE noteId = ?`, [noteId]);
                
                // Insert new entry (limit content size)
                sql.execute(`
                    INSERT INTO notes_fts (noteId, title, content)
                    VALUES (?, ?, SUBSTR(?, 1, 500000))
                `, [noteId, title, content]);
            });
        } catch (error) {
            log.error(`Failed to update FTS index for note ${noteId}: ${error}`);
        }
    }

    /**
     * Remove a note from the FTS index
     */
    removeNoteFromIndex(noteId: string): void {
        if (!this.checkFTS5Availability()) {
            return;
        }

        try {
            sql.execute(`DELETE FROM notes_fts WHERE noteId = ?`, [noteId]);
        } catch (error) {
            log.error(`Failed to remove note ${noteId} from FTS index: ${error}`);
        }
    }

    /**
     * Rebuild the entire FTS index
     * Simple and straightforward - let SQLite handle it
     */
    rebuildIndex(): void {
        if (!this.checkFTS5Availability()) {
            log.error("Cannot rebuild FTS index - FTS5 not available");
            return;
        }

        log.info("Rebuilding FTS5 index...");

        try {
            sql.transactional(() => {
                // Clear existing index
                sql.execute(`DELETE FROM notes_fts`);

                // Rebuild from notes
                sql.execute(`
                    INSERT INTO notes_fts (noteId, title, content)
                    SELECT 
                        n.noteId,
                        n.title,
                        SUBSTR(b.content, 1, 500000)
                    FROM notes n
                    LEFT JOIN blobs b ON n.blobId = b.blobId
                    WHERE n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                        AND b.content IS NOT NULL
                `);

                // Optimize the index
                sql.execute(`INSERT INTO notes_fts(notes_fts) VALUES('optimize')`);
            });

            log.info("FTS5 index rebuild completed");
        } catch (error) {
            log.error(`Failed to rebuild FTS index: ${error}`);
            throw error;
        }
    }

    /**
     * Optimize the FTS index
     * Simple optimization - no complex logic
     */
    optimizeIndex(): void {
        if (!this.checkFTS5Availability()) {
            return;
        }

        try {
            log.info("Optimizing FTS5 index...");
            
            // Simple optimization command
            sql.execute(`INSERT INTO notes_fts(notes_fts) VALUES('optimize')`);
            
            // Update statistics for query planner
            sql.execute(`ANALYZE notes_fts`);
            
            log.info("FTS5 index optimization completed");
        } catch (error) {
            log.error(`Failed to optimize FTS index: ${error}`);
        }
    }

    /**
     * Get basic statistics about the FTS index
     */
    getIndexStats(): {
        totalDocuments: number;
        tableExists: boolean;
    } {
        if (!this.checkFTS5Availability()) {
            return {
                totalDocuments: 0,
                tableExists: false
            };
        }

        try {
            const totalDocuments = sql.getValue<number>(`
                SELECT COUNT(*) FROM notes_fts
            `) || 0;

            return {
                totalDocuments,
                tableExists: true
            };
        } catch (error) {
            log.error(`Failed to get index stats: ${error}`);
            return {
                totalDocuments: 0,
                tableExists: false
            };
        }
    }
}

// Export singleton instance
export const minimalFTSSearchService = new MinimalFTSSearchService();

export default minimalFTSSearchService;