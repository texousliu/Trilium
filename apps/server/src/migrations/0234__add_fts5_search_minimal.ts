/**
 * Minimal FTS5 implementation for Trilium Notes
 * 
 * Design principles:
 * - Use only native SQLite FTS5 functionality
 * - Single FTS table with porter tokenizer for word search
 * - Prefix indexes for substring matching
 * - Simple triggers for synchronization
 * - No complex memory management or optimization
 * - Let SQLite handle the scale
 */

import sql from "../services/sql.js";
import log from "../services/log.js";

export default function addMinimalFTS5Search() {
    log.info("Setting up minimal FTS5 search for large-scale databases...");
    
    // Step 1: Clean up any existing FTS tables
    log.info("Cleaning up existing FTS tables...");
    sql.executeScript(`
        -- Drop all existing FTS-related tables
        DROP TABLE IF EXISTS notes_fts;
        DROP TABLE IF EXISTS notes_fts_trigram;
        DROP TABLE IF EXISTS notes_fts_aux;
        DROP TABLE IF EXISTS notes_fts_config;
        DROP TABLE IF EXISTS notes_fts_stats;
        DROP VIEW IF EXISTS notes_content;
    `);

    // Step 2: Create the single FTS5 virtual table
    log.info("Creating minimal FTS5 table...");
    sql.executeScript(`
        -- Single FTS5 table with porter tokenizer
        -- Porter provides stemming for better word matching
        -- Prefix indexes enable efficient substring search
        CREATE VIRTUAL TABLE notes_fts USING fts5(
            noteId UNINDEXED,  -- Store noteId but don't index it
            title,
            content,
            tokenize = 'porter unicode61',
            prefix = '2 3 4'    -- Index prefixes of 2, 3, and 4 chars for substring search
        );
        
        -- Create an index on notes table for efficient FTS joins
        CREATE INDEX IF NOT EXISTS idx_notes_fts_lookup 
        ON notes(noteId, type, isDeleted, isProtected);
    `);

    // Step 3: Set PRAGMA settings for large databases
    log.info("Configuring SQLite for large database performance...");
    sql.executeScript(`
        -- Increase cache size to 256MB for better performance
        PRAGMA cache_size = -256000;
        
        -- Use memory for temp storage
        PRAGMA temp_store = MEMORY;
        
        -- Increase page size for better I/O with large data
        -- Note: This only affects new databases, existing ones keep their page size
        PRAGMA page_size = 8192;
        
        -- Enable query planner optimizations
        PRAGMA optimize;
    `);

    // Step 4: Initial population of FTS index
    log.info("Populating FTS index with existing notes...");
    
    try {
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
        
        log.info(`Found ${totalNotes} notes to index`);
        
        if (totalNotes > 0) {
            // Use a single INSERT...SELECT for maximum efficiency
            // SQLite will handle the memory management internally
            sql.transactional(() => {
                sql.execute(`
                    INSERT INTO notes_fts (noteId, title, content)
                    SELECT 
                        n.noteId,
                        n.title,
                        -- Limit content to first 500KB to prevent memory issues
                        -- Most searches don't need the full content
                        SUBSTR(b.content, 1, 500000) as content
                    FROM notes n
                    LEFT JOIN blobs b ON n.blobId = b.blobId
                    WHERE n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                        AND n.isDeleted = 0
                        AND n.isProtected = 0
                        AND b.content IS NOT NULL
                `);
            });
            
            log.info(`Indexed ${totalNotes} notes`);
            
            // Run initial optimization
            log.info("Running initial FTS optimization...");
            sql.execute(`INSERT INTO notes_fts(notes_fts) VALUES('optimize')`);
        }
    } catch (error) {
        log.error(`Failed to populate FTS index: ${error}`);
        throw error;
    }

    // Step 5: Create simple triggers for synchronization
    log.info("Creating FTS synchronization triggers...");
    
    sql.executeScript(`
        -- Trigger for INSERT operations
        CREATE TRIGGER notes_fts_insert
        AFTER INSERT ON notes
        FOR EACH ROW
        WHEN NEW.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
            AND NEW.isDeleted = 0
            AND NEW.isProtected = 0
        BEGIN
            INSERT INTO notes_fts (noteId, title, content)
            SELECT 
                NEW.noteId,
                NEW.title,
                SUBSTR(b.content, 1, 500000)
            FROM blobs b
            WHERE b.blobId = NEW.blobId;
        END;
        
        -- Trigger for UPDATE operations
        CREATE TRIGGER notes_fts_update
        AFTER UPDATE ON notes
        FOR EACH ROW
        BEGIN
            -- Always delete the old entry
            DELETE FROM notes_fts WHERE noteId = OLD.noteId;
            
            -- Insert new entry if eligible
            INSERT INTO notes_fts (noteId, title, content)
            SELECT 
                NEW.noteId,
                NEW.title,
                SUBSTR(b.content, 1, 500000)
            FROM blobs b
            WHERE b.blobId = NEW.blobId
                AND NEW.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                AND NEW.isDeleted = 0
                AND NEW.isProtected = 0;
        END;
        
        -- Trigger for DELETE operations
        CREATE TRIGGER notes_fts_delete
        AFTER DELETE ON notes
        FOR EACH ROW
        BEGIN
            DELETE FROM notes_fts WHERE noteId = OLD.noteId;
        END;
        
        -- Trigger for blob updates
        CREATE TRIGGER blobs_fts_update
        AFTER UPDATE ON blobs
        FOR EACH ROW
        BEGIN
            -- Update all notes that reference this blob
            DELETE FROM notes_fts 
            WHERE noteId IN (
                SELECT noteId FROM notes WHERE blobId = NEW.blobId
            );
            
            INSERT INTO notes_fts (noteId, title, content)
            SELECT 
                n.noteId,
                n.title,
                SUBSTR(NEW.content, 1, 500000)
            FROM notes n
            WHERE n.blobId = NEW.blobId
                AND n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                AND n.isDeleted = 0
                AND n.isProtected = 0;
        END;
        
        -- Trigger for blob inserts
        CREATE TRIGGER blobs_fts_insert
        AFTER INSERT ON blobs
        FOR EACH ROW
        BEGIN
            INSERT INTO notes_fts (noteId, title, content)
            SELECT 
                n.noteId,
                n.title,
                SUBSTR(NEW.content, 1, 500000)
            FROM notes n
            WHERE n.blobId = NEW.blobId
                AND n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                AND n.isDeleted = 0
                AND n.isProtected = 0;
        END;
    `);
    
    // Step 6: Analyze tables for query optimizer
    log.info("Analyzing tables for query optimizer...");
    sql.executeScript(`
        ANALYZE notes;
        ANALYZE notes_fts;
        ANALYZE blobs;
    `);
    
    log.info("Minimal FTS5 setup completed successfully");
}