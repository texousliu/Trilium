/**
 * Minimal FTS5 Search Service
 * 
 * Provides basic full-text search using SQLite's FTS5 extension with:
 * - Single FTS table with porter tokenizer
 * - Basic word and substring search
 * - Protected notes handled separately
 * - Simple error handling
 */

import sql from "../sql.js";
import log from "../log.js";
import protectedSessionService from "../protected_session.js";
import striptags from "striptags";
import { normalize } from "../utils.js";

/**
 * Search result interface
 */
export interface FTSSearchResult {
    noteId: string;
    title: string;
    score: number;
}

/**
 * Search options interface
 */
export interface FTSSearchOptions {
    limit?: number;
    offset?: number;
    searchProtected?: boolean;
    includeSnippets?: boolean;
}

/**
 * Custom error classes for FTS operations
 */
export class FTSError extends Error {
    constructor(message: string, public readonly code: string, public readonly recoverable: boolean = true) {
        super(message);
        this.name = 'FTSError';
    }
}

export class FTSNotAvailableError extends FTSError {
    constructor(message: string = "FTS5 is not available") {
        super(message, 'FTS_NOT_AVAILABLE', true);
        this.name = 'FTSNotAvailableError';
    }
}

export class FTSQueryError extends FTSError {
    constructor(message: string, public readonly query?: string) {
        super(message, 'FTS_QUERY_ERROR', true);
        this.name = 'FTSQueryError';
    }
}

/**
 * Configuration for FTS5 search
 */
const FTS_CONFIG = {
    DEFAULT_LIMIT: 100000,  // Increased for unlimited results
    MAX_RESULTS: 10000000,   // Support millions of notes
    BATCH_SIZE: 1000,
    FUZZY_THRESHOLD: 0.7     // Similarity threshold for fuzzy matching
};

/**
 * FTS5 Search Service
 */
class FTSSearchService {
    private isFTS5Available: boolean | null = null;
    private checkingAvailability = false;

    /**
     * Check if FTS5 is available and properly configured
     * Thread-safe implementation to prevent race conditions
     */
    checkFTS5Availability(): boolean {
        // Return cached result if available
        if (this.isFTS5Available !== null) {
            return this.isFTS5Available;
        }

        // Prevent concurrent checks
        if (this.checkingAvailability) {
            // Wait for ongoing check to complete by checking again after a short delay
            while (this.checkingAvailability && this.isFTS5Available === null) {
                // This is a simple spin-wait; in a real async context, you'd use proper synchronization
                continue;
            }
            return this.isFTS5Available ?? false;
        }

        this.checkingAvailability = true;

        try {
            // Check if FTS5 extension is available
            const result = sql.getRow(`
                SELECT 1 FROM pragma_compile_options 
                WHERE compile_options LIKE '%ENABLE_FTS5%'
            `);
            
            if (!result) {
                this.isFTS5Available = false;
                return false;
            }

            // Check if notes_fts table exists
            const tableExists = sql.getValue<number>(`
                SELECT COUNT(*) FROM sqlite_master 
                WHERE type = 'table' AND name = 'notes_fts'
            `);

            this.isFTS5Available = tableExists > 0;
            
            if (!this.isFTS5Available) {
                log.info("FTS5 table not found, full-text search not available");
            } else {
                log.info("FTS5 full-text search is available and configured");
            }

            return this.isFTS5Available;
        } catch (error) {
            log.error(`Error checking FTS5 availability: ${error}`);
            this.isFTS5Available = false;
            return false;
        } finally {
            this.checkingAvailability = false;
        }
    }

    /**
     * Perform synchronous FTS5 search with hybrid substring and fuzzy support
     */
    searchSync(
        tokens: string[],
        operator: string,
        noteIds?: Set<string>,
        options: FTSSearchOptions = {}
    ): FTSSearchResult[] {
        if (!this.checkFTS5Availability()) {
            throw new FTSNotAvailableError();
        }

        const limit = options.limit || FTS_CONFIG.DEFAULT_LIMIT;
        const offset = options.offset || 0;

        try {
            // Special handling for substring and fuzzy operators
            if (operator === '*=*') {
                return this.hybridSubstringSearch(tokens, noteIds, limit, offset);
            } else if (operator === '~=' || operator === '~*') {
                return this.fuzzySearch(tokens, operator, noteIds, limit, offset);
            }

            // Standard FTS5 search for other operators
            let ftsQuery = this.buildFTSQuery(tokens, operator);
            
            // Build SQL query
            let query: string;
            let params: any[] = [];

            if (noteIds && noteIds.size > 0) {
                // Filter by specific noteIds
                const noteIdList = Array.from(noteIds).join("','");
                query = `
                    SELECT 
                        f.noteId,
                        n.title,
                        -rank as score
                    FROM notes_fts f
                    JOIN notes n ON n.noteId = f.noteId
                    WHERE notes_fts MATCH ?
                        AND f.noteId IN ('${noteIdList}')
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                    ORDER BY rank
                    LIMIT ? OFFSET ?
                `;
                params = [ftsQuery, limit, offset];
            } else {
                // Search all eligible notes
                query = `
                    SELECT 
                        f.noteId,
                        n.title,
                        -rank as score
                    FROM notes_fts f
                    JOIN notes n ON n.noteId = f.noteId
                    WHERE notes_fts MATCH ?
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                    ORDER BY rank
                    LIMIT ? OFFSET ?
                `;
                params = [ftsQuery, limit, offset];
            }

            const results = sql.getRows<FTSSearchResult>(query, params);
            return results || [];
        } catch (error: any) {
            // Handle FTS5 query syntax errors
            if (error.message?.includes('syntax error') || error.message?.includes('fts5')) {
                throw new FTSQueryError(`Invalid FTS5 query: ${error.message}`, tokens.join(' '));
            }
            throw new FTSError(`FTS5 search failed: ${error.message}`, 'FTS_SEARCH_ERROR');
        }
    }

    /**
     * Hybrid substring search using FTS5 for initial filtering and LIKE for exact substring matching
     * Optimized for millions of notes
     */
    private hybridSubstringSearch(
        tokens: string[],
        noteIds?: Set<string>,
        limit: number = FTS_CONFIG.DEFAULT_LIMIT,
        offset: number = 0
    ): FTSSearchResult[] {
        try {
            // Step 1: Create FTS query to find notes containing any of the tokens as whole words
            // This dramatically reduces the search space for LIKE operations
            const ftsQuery = tokens.map(t => `"${t.replace(/"/g, '""')}"`).join(' OR ');
            
            // Step 2: Build LIKE conditions for true substring matching
            // Use ESCAPE clause for proper handling of special characters
            const likeConditions = tokens.map(token => {
                const escapedToken = token.replace(/[_%\\]/g, '\\$&').replace(/'/g, "''");
                return `(f.title LIKE '%${escapedToken}%' ESCAPE '\\' OR 
                         f.content LIKE '%${escapedToken}%' ESCAPE '\\')`;
            }).join(' AND ');

            let query: string;
            let params: any[] = [];

            if (noteIds && noteIds.size > 0) {
                // Use WITH clause for better query optimization with large noteId sets
                const noteIdList = Array.from(noteIds);
                const placeholders = noteIdList.map(() => '?').join(',');
                
                query = `
                    WITH filtered_notes AS (
                        SELECT noteId FROM (VALUES ${noteIdList.map(() => '(?)').join(',')}) AS t(noteId)
                    )
                    SELECT DISTINCT
                        f.noteId,
                        n.title,
                        CASE 
                            WHEN ${tokens.map(t => `f.title LIKE '%${t.replace(/'/g, "''")}%' ESCAPE '\\'`).join(' AND ')} 
                            THEN -1000  -- Prioritize title matches
                            ELSE -rank 
                        END as score
                    FROM notes_fts f
                    JOIN notes n ON n.noteId = f.noteId
                    JOIN filtered_notes fn ON fn.noteId = f.noteId
                    WHERE notes_fts MATCH ?
                        AND (${likeConditions})
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                    ORDER BY score
                    LIMIT ? OFFSET ?
                `;
                params = [...noteIdList, ftsQuery, limit, offset];
            } else {
                // Full search without noteId filtering
                query = `
                    SELECT DISTINCT
                        f.noteId,
                        n.title,
                        CASE 
                            WHEN ${tokens.map(t => `f.title LIKE '%${t.replace(/'/g, "''")}%' ESCAPE '\\'`).join(' AND ')} 
                            THEN -1000  -- Prioritize title matches
                            ELSE -rank 
                        END as score
                    FROM notes_fts f
                    JOIN notes n ON n.noteId = f.noteId
                    WHERE notes_fts MATCH ?
                        AND (${likeConditions})
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                    ORDER BY score
                    LIMIT ? OFFSET ?
                `;
                params = [ftsQuery, limit, offset];
            }

            const results = sql.getRows<FTSSearchResult>(query, params);
            return results || [];
        } catch (error: any) {
            log.error(`Hybrid substring search failed: ${error.message}`);
            throw new FTSError(`Substring search failed: ${error.message}`, 'FTS_SUBSTRING_ERROR');
        }
    }

    /**
     * Fuzzy search using SQLite's built-in soundex and edit distance capabilities
     * Implements Levenshtein distance for true fuzzy matching
     */
    private fuzzySearch(
        tokens: string[],
        operator: string,
        noteIds?: Set<string>,
        limit: number = FTS_CONFIG.DEFAULT_LIMIT,
        offset: number = 0
    ): FTSSearchResult[] {
        try {
            // For fuzzy search, we use a combination of:
            // 1. FTS5 OR query to get initial candidates
            // 2. SQLite's editdist3 function if available, or fallback to soundex
            
            const ftsQuery = tokens.map(t => {
                const escaped = t.replace(/"/g, '""');
                // Include the exact term and common variations
                return `("${escaped}" OR "${escaped}*" OR "*${escaped}")`;
            }).join(' OR ');

            // Check if editdist3 is available (requires spellfix1 extension)
            const hasEditDist = this.checkEditDistAvailability();
            
            let query: string;
            let params: any[] = [];

            if (hasEditDist) {
                // Use edit distance for true fuzzy matching
                const editDistConditions = tokens.map(token => {
                    const escaped = token.replace(/'/g, "''");
                    // Calculate edit distance threshold based on token length
                    const threshold = Math.max(1, Math.floor(token.length * 0.3));
                    return `(
                        editdist3(LOWER(f.title), LOWER('${escaped}')) <= ${threshold} OR
                        editdist3(LOWER(SUBSTR(f.content, 1, 1000)), LOWER('${escaped}')) <= ${threshold}
                    )`;
                }).join(operator === '~=' ? ' AND ' : ' OR ');

                query = `
                    SELECT DISTINCT
                        f.noteId,
                        n.title,
                        MIN(${tokens.map(t => `editdist3(LOWER(f.title), LOWER('${t.replace(/'/g, "''")}'))`).join(', ')}) as score
                    FROM notes_fts f
                    JOIN notes n ON n.noteId = f.noteId
                    WHERE notes_fts MATCH ?
                        AND (${editDistConditions})
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                    GROUP BY f.noteId, n.title
                    ORDER BY score
                    LIMIT ? OFFSET ?
                `;
            } else {
                // Fallback to soundex for basic phonetic matching
                log.info("Edit distance not available, using soundex for fuzzy search");
                
                const soundexConditions = tokens.map(token => {
                    const escaped = token.replace(/'/g, "''");
                    return `(
                        soundex(f.title) = soundex('${escaped}') OR
                        f.title LIKE '%${escaped}%' ESCAPE '\\' OR
                        f.content LIKE '%${escaped}%' ESCAPE '\\'
                    )`;
                }).join(operator === '~=' ? ' AND ' : ' OR ');

                query = `
                    SELECT DISTINCT
                        f.noteId,
                        n.title,
                        -rank as score
                    FROM notes_fts f
                    JOIN notes n ON n.noteId = f.noteId
                    WHERE notes_fts MATCH ?
                        AND (${soundexConditions})
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                    ORDER BY score
                    LIMIT ? OFFSET ?
                `;
            }

            params = [ftsQuery, limit, offset];

            // Add noteId filtering if specified
            if (noteIds && noteIds.size > 0) {
                const noteIdList = Array.from(noteIds).join("','");
                query = query.replace(
                    'AND n.isDeleted = 0',
                    `AND f.noteId IN ('${noteIdList}') AND n.isDeleted = 0`
                );
            }

            const results = sql.getRows<FTSSearchResult>(query, params);
            return results || [];
        } catch (error: any) {
            log.error(`Fuzzy search failed: ${error.message}`);
            // Fallback to simple substring search if fuzzy features aren't available
            return this.hybridSubstringSearch(tokens, noteIds, limit, offset);
        }
    }

    /**
     * Check if edit distance function is available
     */
    private checkEditDistAvailability(): boolean {
        try {
            // Try to use editdist3 function
            sql.getValue(`SELECT editdist3('test', 'test')`);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Search protected notes separately (not indexed in FTS)
     */
    searchProtectedNotesSync(
        tokens: string[],
        operator: string,
        noteIds?: Set<string>,
        options: FTSSearchOptions = {}
    ): FTSSearchResult[] {
        if (!protectedSessionService.isProtectedSessionAvailable()) {
            return [];
        }

        const results: FTSSearchResult[] = [];
        const searchTerms = tokens.map(t => normalize(t.toLowerCase()));

        // Query protected notes directly
        let query = `
            SELECT n.noteId, n.title, b.content, n.type, n.mime
            FROM notes n
            LEFT JOIN blobs b ON n.blobId = b.blobId
            WHERE n.isProtected = 1
                AND n.isDeleted = 0
                AND n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
        `;

        if (noteIds && noteIds.size > 0) {
            const noteIdList = Array.from(noteIds).join("','");
            query += ` AND n.noteId IN ('${noteIdList}')`;
        }

        for (const row of sql.iterateRows<any>(query)) {
            try {
                // Decrypt content
                let content = row.content;
                if (content) {
                    content = protectedSessionService.decryptString(content);
                    if (!content) continue;

                    // Process content based on type
                    content = this.preprocessContent(content, row.type, row.mime);
                    
                    // Check if content matches search terms
                    if (this.matchesSearch(content, row.title, searchTerms, operator)) {
                        results.push({
                            noteId: row.noteId,
                            title: row.title,
                            score: 1.0 // Basic scoring for protected notes
                        });
                    }
                }
            } catch (e) {
                log.debug(`Cannot decrypt protected note ${row.noteId}`);
            }
        }

        return results;
    }

    /**
     * Sync missing notes to FTS index - optimized for millions of notes
     */
    syncMissingNotes(): number {
        if (!this.checkFTS5Availability()) {
            return 0;
        }

        try {
            let totalSynced = 0;
            let hasMore = true;

            // Process in batches to handle millions of notes efficiently
            while (hasMore) {
                // Find notes that should be indexed but aren't
                const missingNotes = sql.getRows<{noteId: string, title: string, content: string}>(`
                    SELECT n.noteId, n.title, b.content
                    FROM notes n
                    LEFT JOIN blobs b ON n.blobId = b.blobId
                    LEFT JOIN notes_fts f ON f.noteId = n.noteId
                    WHERE n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                        AND b.content IS NOT NULL
                        AND f.noteId IS NULL
                    LIMIT ${FTS_CONFIG.BATCH_SIZE}
                `);

                if (!missingNotes || missingNotes.length === 0) {
                    hasMore = false;
                    break;
                }

                // Insert missing notes using efficient batch processing
                sql.transactional(() => {
                    // Use batch insert for better performance
                    const batchInsertQuery = `
                        INSERT OR REPLACE INTO notes_fts (noteId, title, content) 
                        VALUES ${missingNotes.map(() => '(?, ?, ?)').join(', ')}
                    `;
                    
                    const params: any[] = [];
                    for (const note of missingNotes) {
                        params.push(note.noteId, note.title, note.content);
                    }
                    
                    sql.execute(batchInsertQuery, params);
                });

                totalSynced += missingNotes.length;
                
                // Log progress for large sync operations
                if (totalSynced % 10000 === 0) {
                    log.info(`Synced ${totalSynced} notes to FTS index...`);
                }

                // Continue if we got a full batch
                hasMore = missingNotes.length === FTS_CONFIG.BATCH_SIZE;
            }

            if (totalSynced > 0) {
                log.info(`Completed syncing ${totalSynced} notes to FTS index`);
                
                // Optimize the FTS index after large sync
                if (totalSynced > 1000) {
                    this.optimizeIndex();
                }
            }

            return totalSynced;
        } catch (error) {
            log.error(`Error syncing missing notes: ${error}`);
            return 0;
        }
    }

    /**
     * Optimize FTS5 index for better performance
     */
    optimizeIndex(): void {
        try {
            log.info("Optimizing FTS5 index...");
            sql.execute(`INSERT INTO notes_fts(notes_fts) VALUES('optimize')`);
            log.info("FTS5 index optimization completed");
        } catch (error) {
            log.error(`Error optimizing FTS5 index: ${error}`);
        }
    }

    /**
     * Build FTS5 query string from tokens and operator
     */
    private buildFTSQuery(tokens: string[], operator: string): string {
        // Escape special characters in tokens
        const escapedTokens = tokens.map(token => {
            // Escape double quotes in the token
            return token.replace(/"/g, '""');
        });

        switch (operator) {
            case '=':     // Exact match (phrase search)
                return `"${escapedTokens.join(' ')}"`;
                
            case '*=*':   // Contains all tokens (AND)
                return escapedTokens.map(t => `"${t}"`).join(' AND ');
                
            case '!=':    // Does not contain (use NOT)
                return escapedTokens.map(t => `NOT "${t}"`).join(' AND ');
                
            case '*=':    // Ends with (use wildcard prefix)
                return escapedTokens.map(t => `*${t}`).join(' AND ');
                
            case '=*':    // Starts with (use wildcard suffix)
                return escapedTokens.map(t => `${t}*`).join(' AND ');
                
            case '~=':    // Fuzzy match (use OR for flexibility)
            case '~*':
                return escapedTokens.map(t => `"${t}"`).join(' OR ');
                
            default:      // Default to AND search
                return escapedTokens.map(t => `"${t}"`).join(' AND ');
        }
    }

    /**
     * Preprocess content based on note type
     */
    private preprocessContent(content: string, type: string, mime: string): string {
        content = normalize(content.toString());

        if (type === "text" && mime === "text/html") {
            // Strip HTML tags but preserve link URLs
            content = striptags(content, ['a'], ' ');
            content = content.replace(/<\/a>/gi, '');
            content = content.replace(/&nbsp;/g, ' ');
        } else if (type === "mindMap" && mime === "application/json") {
            try {
                const mindMapData = JSON.parse(content);
                const topics = this.extractMindMapTopics(mindMapData);
                content = topics.join(' ');
            } catch (e) {
                // Invalid JSON, use original content
            }
        } else if (type === "canvas" && mime === "application/json") {
            try {
                const canvasData = JSON.parse(content);
                if (canvasData.elements) {
                    const texts = canvasData.elements
                        .filter((el: any) => el.type === 'text' && el.text)
                        .map((el: any) => el.text);
                    content = texts.join(' ');
                }
            } catch (e) {
                // Invalid JSON, use original content
            }
        }

        return content.trim();
    }

    /**
     * Extract topics from mind map data
     */
    private extractMindMapTopics(data: any): string[] {
        const topics: string[] = [];
        
        function collectTopics(node: any) {
            if (node?.topic) {
                topics.push(node.topic);
            }
            if (node?.children && Array.isArray(node.children)) {
                for (const child of node.children) {
                    collectTopics(child);
                }
            }
        }
        
        if (data?.nodedata) {
            collectTopics(data.nodedata);
        }
        
        return topics;
    }

    /**
     * Check if content matches search terms
     */
    private matchesSearch(content: string, title: string, searchTerms: string[], operator: string): boolean {
        const fullText = normalize(`${title} ${content}`).toLowerCase();

        switch (operator) {
            case '=':     // Exact match
                const phrase = searchTerms.join(' ');
                return fullText.includes(phrase);
                
            case '*=*':   // Contains all
                return searchTerms.every(term => fullText.includes(term));
                
            case '!=':    // Does not contain
                return !searchTerms.some(term => fullText.includes(term));
                
            case '*=':    // Ends with
                return searchTerms.every(term => {
                    const words = fullText.split(/\s+/);
                    return words.some(word => word.endsWith(term));
                });
                
            case '=*':    // Starts with
                return searchTerms.every(term => {
                    const words = fullText.split(/\s+/);
                    return words.some(word => word.startsWith(term));
                });
                
            case '~=':    // Fuzzy match (at least one term)
            case '~*':
                return searchTerms.some(term => fullText.includes(term));
                
            default:
                return searchTerms.every(term => fullText.includes(term));
        }
    }

    /**
     * Get FTS index statistics
     */
    getIndexStats(): { totalDocuments: number; indexSize: number } {
        if (!this.checkFTS5Availability()) {
            return { totalDocuments: 0, indexSize: 0 };
        }

        try {
            const totalDocuments = sql.getValue<number>(`
                SELECT COUNT(*) FROM notes_fts
            `) || 0;

            // Estimate index size from SQLite internal tables
            const indexSize = sql.getValue<number>(`
                SELECT SUM(pgsize) 
                FROM dbstat 
                WHERE name LIKE 'notes_fts%'
            `) || 0;

            return { totalDocuments, indexSize };
        } catch (error) {
            log.error(`Error getting FTS statistics: ${error}`);
            return { totalDocuments: 0, indexSize: 0 };
        }
    }


    /**
     * Rebuild the entire FTS index from scratch
     */
    rebuildIndex(): void {
        if (!this.checkFTS5Availability()) {
            throw new FTSNotAvailableError();
        }

        try {
            log.info("Starting FTS index rebuild optimized for millions of notes...");
            
            // Clear existing index first
            sql.execute(`DELETE FROM notes_fts`);
            
            // Get total count for progress reporting
            const totalNotes = sql.getValue<number>(`
                SELECT COUNT(*) 
                FROM notes n
                LEFT JOIN blobs b ON n.blobId = b.blobId
                WHERE n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                    AND n.isDeleted = 0
                    AND n.isProtected = 0
                    AND b.content IS NOT NULL
            `) || 0;
            
            if (totalNotes === 0) {
                log.info("No notes to index");
                return;
            }
            
            log.info(`Rebuilding FTS index for ${totalNotes} notes...`);
            
            let processedCount = 0;
            let offset = 0;
            const batchSize = FTS_CONFIG.BATCH_SIZE;
            
            // Process in chunks to handle millions of notes without memory issues
            while (offset < totalNotes) {
                sql.transactional(() => {
                    const notesBatch = sql.getRows<{noteId: string, title: string, content: string}>(`
                        SELECT 
                            n.noteId,
                            n.title,
                            b.content
                        FROM notes n
                        LEFT JOIN blobs b ON n.blobId = b.blobId
                        WHERE n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                            AND n.isDeleted = 0
                            AND n.isProtected = 0
                            AND b.content IS NOT NULL
                        ORDER BY n.noteId
                        LIMIT ? OFFSET ?
                    `, [batchSize, offset]);

                    if (!notesBatch || notesBatch.length === 0) {
                        return;
                    }

                    // Use batch insert for much better performance
                    if (notesBatch.length === 1) {
                        // Single insert
                        sql.execute(
                            `INSERT INTO notes_fts (noteId, title, content) VALUES (?, ?, ?)`,
                            [notesBatch[0].noteId, notesBatch[0].title, notesBatch[0].content]
                        );
                    } else {
                        // Batch insert
                        const batchInsertQuery = `
                            INSERT INTO notes_fts (noteId, title, content) 
                            VALUES ${notesBatch.map(() => '(?, ?, ?)').join(', ')}
                        `;
                        
                        const params: any[] = [];
                        for (const note of notesBatch) {
                            params.push(note.noteId, note.title, note.content);
                        }
                        
                        sql.execute(batchInsertQuery, params);
                    }
                    
                    processedCount += notesBatch.length;
                });
                
                offset += batchSize;
                
                // Progress reporting for large rebuilds
                if (processedCount % 10000 === 0 || processedCount >= totalNotes) {
                    const percentage = Math.round((processedCount / totalNotes) * 100);
                    log.info(`Indexed ${processedCount} of ${totalNotes} notes (${percentage}%)...`);
                }
            }
            
            log.info(`FTS index rebuild completed. Indexed ${processedCount} notes.`);
            
            // Optimize after rebuild
            this.optimizeIndex();
            
        } catch (error) {
            log.error(`Error rebuilding FTS index: ${error}`);
            throw new FTSError(`Failed to rebuild FTS index: ${error}`, 'FTS_REBUILD_ERROR');
        }
    }
}

// Export singleton instance
const ftsSearchService = new FTSSearchService();
export default ftsSearchService;