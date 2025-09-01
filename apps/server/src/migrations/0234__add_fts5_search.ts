/**
 * Migration to add FTS5 full-text search support
 * 
 * This migration implements a minimal FTS5 search solution that:
 * 1. Uses a single FTS5 table with porter tokenizer for stemming
 * 2. Implements simple triggers for synchronization
 * 3. Excludes protected notes from indexing
 * 4. Sets essential performance pragmas
 */

import sql from "../services/sql.js";
import log from "../services/log.js";

export default function addFTS5SearchAndPerformanceIndexes() {
    log.info("Setting up FTS5 search...");
    
    // Create FTS5 virtual table with porter tokenizer
    log.info("Creating FTS5 virtual table...");
    
    // Set optimal SQLite pragmas for FTS5 operations with millions of notes
    sql.executeScript(`
        -- Memory and performance pragmas for large-scale FTS operations
        PRAGMA cache_size = -262144;        -- 256MB cache for better performance
        PRAGMA temp_store = MEMORY;         -- Use RAM for temporary storage
        PRAGMA mmap_size = 536870912;       -- 512MB memory-mapped I/O
        PRAGMA synchronous = NORMAL;        -- Faster writes with good safety
        PRAGMA journal_mode = WAL;          -- Write-ahead logging for better concurrency
        PRAGMA wal_autocheckpoint = 1000;   -- Auto-checkpoint every 1000 pages
        PRAGMA automatic_index = ON;        -- Allow automatic indexes
        PRAGMA threads = 4;                 -- Use multiple threads for sorting
        
        -- Drop existing FTS tables if they exist
        DROP TABLE IF EXISTS notes_fts;
        DROP TABLE IF EXISTS notes_fts_trigram;
        DROP TABLE IF EXISTS notes_fts_config;
        DROP TABLE IF EXISTS notes_fts_stats;
        DROP TABLE IF EXISTS notes_fts_aux;
        
        -- Create optimized FTS5 virtual table for millions of notes
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            noteId UNINDEXED,
            title,
            content,
            tokenize = 'porter unicode61',
            prefix = '2 3 4',      -- Index prefixes of 2, 3, and 4 characters for faster prefix searches
            columnsize = 0,        -- Reduce index size by not storing column sizes (saves ~25% space)
            detail = full          -- Keep full detail for snippet generation
        );
    `);

    log.info("Populating FTS5 table with existing note content...");

    // Optimized population with batch inserts and better memory management
    const batchSize = 5000;  // Larger batch size for better performance
    let processedCount = 0;

    try {
        // Count eligible notes first
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

        // Process in optimized batches using a prepared statement
        sql.transactional(() => {
            // Prepare statement for batch inserts
            const insertStmt = sql.prepare(`
                INSERT OR REPLACE INTO notes_fts (noteId, title, content)
                VALUES (?, ?, ?)
            `);

            let offset = 0;
            while (offset < totalNotes) {
                // Fetch batch of notes
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
                    break;
                }

                // Batch insert using prepared statement
                for (const note of notesBatch) {
                    insertStmt.run(note.noteId, note.title, note.content);
                }
                
                offset += notesBatch.length;
                processedCount += notesBatch.length;
                
                // Progress reporting every 10k notes
                if (processedCount % 10000 === 0 || processedCount === totalNotes) {
                    log.info(`Indexed ${processedCount} of ${totalNotes} notes (${Math.round((processedCount / totalNotes) * 100)}%)...`);
                }

                // Early exit if we processed fewer notes than batch size
                if (notesBatch.length < batchSize) {
                    break;
                }
            }
            
            // Finalize prepared statement
            insertStmt.finalize();
        });
    } catch (error) {
        log.error(`Failed to populate FTS index: ${error}`);
        throw new Error(`FTS5 migration failed during population: ${error}`);
    }

    log.info(`Completed FTS indexing of ${processedCount} notes`);

    // Create synchronization triggers
    log.info("Creating FTS synchronization triggers...");

    // Drop all existing triggers first
    const existingTriggers = [
        'notes_fts_insert', 'notes_fts_update', 'notes_fts_delete',
        'notes_fts_soft_delete', 'notes_fts_blob_insert', 'notes_fts_blob_update',
        'notes_fts_protect', 'notes_fts_unprotect', 'notes_fts_sync',
        'notes_fts_update_sync', 'notes_fts_delete_sync', 'blobs_fts_sync',
        'blobs_fts_insert_sync'
    ];
    
    for (const trigger of existingTriggers) {
        sql.execute(`DROP TRIGGER IF EXISTS ${trigger}`);
    }

    // Create optimized triggers for notes table operations
    sql.execute(`
        CREATE TRIGGER notes_fts_insert
        AFTER INSERT ON notes
        WHEN NEW.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
            AND NEW.isDeleted = 0
            AND NEW.isProtected = 0
        BEGIN
            -- Use INSERT OR REPLACE for better handling of duplicate entries
            INSERT OR REPLACE INTO notes_fts (noteId, title, content)
            SELECT 
                NEW.noteId,
                NEW.title,
                COALESCE(b.content, '')
            FROM (SELECT NEW.blobId AS blobId) AS note_blob
            LEFT JOIN blobs b ON b.blobId = note_blob.blobId;
        END;
    `);

    sql.execute(`
        CREATE TRIGGER notes_fts_update
        AFTER UPDATE ON notes
        WHEN (
            -- Only fire when relevant fields change or status changes
            OLD.title != NEW.title OR
            OLD.type != NEW.type OR
            OLD.blobId != NEW.blobId OR
            OLD.isDeleted != NEW.isDeleted OR
            OLD.isProtected != NEW.isProtected
        )
        BEGIN
            -- Always remove old entry first
            DELETE FROM notes_fts WHERE noteId = OLD.noteId;
            
            -- Insert new entry if eligible (avoid redundant work)
            INSERT OR REPLACE INTO notes_fts (noteId, title, content)
            SELECT 
                NEW.noteId,
                NEW.title,
                COALESCE(b.content, '')
            FROM (SELECT NEW.blobId AS blobId) AS note_blob
            LEFT JOIN blobs b ON b.blobId = note_blob.blobId
            WHERE NEW.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                AND NEW.isDeleted = 0
                AND NEW.isProtected = 0;
        END;
    `);

    sql.execute(`
        CREATE TRIGGER notes_fts_delete
        AFTER DELETE ON notes
        BEGIN
            DELETE FROM notes_fts WHERE noteId = OLD.noteId;
        END;
    `);

    // Create optimized triggers for blob updates
    sql.execute(`
        CREATE TRIGGER blobs_fts_update
        AFTER UPDATE ON blobs
        WHEN OLD.content != NEW.content  -- Only fire when content actually changes
        BEGIN
            -- Use efficient INSERT OR REPLACE to update all notes referencing this blob
            INSERT OR REPLACE INTO notes_fts (noteId, title, content)
            SELECT 
                n.noteId,
                n.title,
                NEW.content
            FROM notes n
            WHERE n.blobId = NEW.blobId
                AND n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                AND n.isDeleted = 0
                AND n.isProtected = 0;
        END;
    `);

    sql.execute(`
        CREATE TRIGGER blobs_fts_insert
        AFTER INSERT ON blobs
        BEGIN
            -- Use INSERT OR REPLACE to handle potential race conditions
            INSERT OR REPLACE INTO notes_fts (noteId, title, content)
            SELECT 
                n.noteId,
                n.title,
                NEW.content
            FROM notes n
            WHERE n.blobId = NEW.blobId
                AND n.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
                AND n.isDeleted = 0
                AND n.isProtected = 0;
        END;
    `);

    log.info("FTS5 setup completed successfully");
    
    // Run optimization
    log.info("Optimizing FTS5 index...");
    sql.execute(`INSERT INTO notes_fts(notes_fts) VALUES('optimize')`);
    
    // Set comprehensive SQLite pragmas optimized for millions of notes
    log.info("Configuring SQLite pragmas for large-scale FTS performance...");
    
    sql.executeScript(`
        -- Memory Management (Critical for large databases)
        PRAGMA cache_size = -262144;     -- 256MB cache (was 50MB) - critical for FTS performance
        PRAGMA temp_store = MEMORY;      -- Use memory for temporary tables and indices
        PRAGMA mmap_size = 536870912;    -- 512MB memory-mapped I/O for better read performance
        
        -- Write Optimization (Important for batch operations)
        PRAGMA synchronous = NORMAL;     -- Balance between safety and performance (was FULL)
        PRAGMA journal_mode = WAL;       -- Write-Ahead Logging for better concurrency
        PRAGMA wal_autocheckpoint = 1000; -- Checkpoint every 1000 pages for memory management
        
        -- Query Optimization (Essential for FTS queries)
        PRAGMA automatic_index = ON;     -- Allow SQLite to create automatic indexes
        PRAGMA optimize;                 -- Update query planner statistics
        
        -- FTS-Specific Optimizations
        PRAGMA threads = 4;              -- Use multiple threads for FTS operations (if available)
        
        -- Run comprehensive ANALYZE on all FTS-related tables
        ANALYZE notes_fts;
        ANALYZE notes;
        ANALYZE blobs;
    `);
    
    log.info("FTS5 migration completed successfully");
}