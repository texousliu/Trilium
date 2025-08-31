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
    DEFAULT_LIMIT: 100,
    MAX_RESULTS: 10000,
    BATCH_SIZE: 1000
};

/**
 * FTS5 Search Service
 */
class FTSSearchService {
    private isFTS5Available: boolean | null = null;

    /**
     * Check if FTS5 is available and properly configured
     */
    checkFTS5Availability(): boolean {
        if (this.isFTS5Available !== null) {
            return this.isFTS5Available;
        }

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
            }

            return this.isFTS5Available;
        } catch (error) {
            log.error(`Error checking FTS5 availability: ${error}`);
            this.isFTS5Available = false;
            return false;
        }
    }

    /**
     * Perform synchronous FTS5 search
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

        const limit = Math.min(options.limit || FTS_CONFIG.DEFAULT_LIMIT, FTS_CONFIG.MAX_RESULTS);
        const offset = options.offset || 0;

        try {
            // Build FTS5 query based on operator
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
     * Sync missing notes to FTS index
     */
    syncMissingNotes(): number {
        if (!this.checkFTS5Availability()) {
            return 0;
        }

        try {
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
                LIMIT 1000
            `);

            if (!missingNotes || missingNotes.length === 0) {
                return 0;
            }

            // Insert missing notes in batches
            sql.transactional(() => {
                for (const note of missingNotes) {
                    sql.execute(`
                        INSERT INTO notes_fts (noteId, title, content)
                        VALUES (?, ?, ?)
                    `, [note.noteId, note.title, note.content]);
                }
            });

            log.info(`Synced ${missingNotes.length} missing notes to FTS index`);
            return missingNotes.length;
        } catch (error) {
            log.error(`Error syncing missing notes: ${error}`);
            return 0;
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
     * Optimize FTS index (run during maintenance)
     */
    optimizeIndex(): void {
        if (!this.checkFTS5Availability()) {
            return;
        }

        try {
            sql.execute(`INSERT INTO notes_fts(notes_fts) VALUES('optimize')`);
            log.info("FTS5 index optimized");
        } catch (error) {
            log.error(`Error optimizing FTS5 index: ${error}`);
        }
    }

    /**
     * Get FTS index statistics
     */
    getStatistics(): { documentCount: number; indexSize: number } {
        if (!this.checkFTS5Availability()) {
            return { documentCount: 0, indexSize: 0 };
        }

        try {
            const documentCount = sql.getValue<number>(`
                SELECT COUNT(*) FROM notes_fts
            `) || 0;

            // Estimate index size from SQLite internal tables
            const indexSize = sql.getValue<number>(`
                SELECT SUM(pgsize) 
                FROM dbstat 
                WHERE name LIKE 'notes_fts%'
            `) || 0;

            return { documentCount, indexSize };
        } catch (error) {
            log.error(`Error getting FTS statistics: ${error}`);
            return { documentCount: 0, indexSize: 0 };
        }
    }
}

// Export singleton instance
const ftsSearchService = new FTSSearchService();
export default ftsSearchService;