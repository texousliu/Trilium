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
    
    sql.executeScript(`
        -- Drop existing FTS tables if they exist
        DROP TABLE IF EXISTS notes_fts;
        DROP TABLE IF EXISTS notes_fts_trigram;
        DROP TABLE IF EXISTS notes_fts_config;
        DROP TABLE IF EXISTS notes_fts_stats;
        DROP TABLE IF EXISTS notes_fts_aux;
        
        -- Create FTS5 virtual table with porter tokenizer for stemming
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            noteId UNINDEXED,
            title,
            content,
            tokenize = 'porter unicode61',
            prefix = '2 3'  -- Index prefixes of 2 and 3 characters for faster prefix searches
        );
    `);

    log.info("Populating FTS5 table with existing note content...");

    // Populate the FTS table with existing notes
    const batchSize = 1000;
    let processedCount = 0;

    try {
        sql.transactional(() => {
            // Count eligible notes
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
            
            // Insert notes in batches
            let offset = 0;
            while (offset < totalNotes) {
                sql.execute(`
                    INSERT INTO notes_fts (noteId, title, content)
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
                
                offset += batchSize;
                processedCount = Math.min(offset, totalNotes);
                
                if (processedCount % 10000 === 0) {
                    log.info(`Indexed ${processedCount} of ${totalNotes} notes...`);
                }
            }
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

    // Create triggers for notes table operations
    sql.execute(`
        CREATE TRIGGER notes_fts_insert
        AFTER INSERT ON notes
        WHEN NEW.type IN ('text', 'code', 'mermaid', 'canvas', 'mindMap')
            AND NEW.isDeleted = 0
            AND NEW.isProtected = 0
        BEGIN
            INSERT INTO notes_fts (noteId, title, content)
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
        BEGIN
            -- Delete old entry
            DELETE FROM notes_fts WHERE noteId = OLD.noteId;
            
            -- Insert new entry if eligible
            INSERT INTO notes_fts (noteId, title, content)
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

    // Create triggers for blob updates
    sql.execute(`
        CREATE TRIGGER blobs_fts_update
        AFTER UPDATE ON blobs
        BEGIN
            -- Update all notes that reference this blob
            DELETE FROM notes_fts 
            WHERE noteId IN (
                SELECT noteId FROM notes 
                WHERE blobId = NEW.blobId
            );
            
            INSERT INTO notes_fts (noteId, title, content)
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
            INSERT INTO notes_fts (noteId, title, content)
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
    
    // Set essential SQLite pragmas for better performance
    sql.executeScript(`
        -- Increase cache size (50MB)
        PRAGMA cache_size = -50000;
        
        -- Use memory for temp storage
        PRAGMA temp_store = 2;
        
        -- Run ANALYZE on FTS tables
        ANALYZE notes_fts;
    `);
    
    log.info("FTS5 migration completed successfully");
}