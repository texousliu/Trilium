import sql from "../services/sql.js";

export default function() {
    // Create OCR results table to store extracted text from images
    sql.execute(`
        CREATE TABLE IF NOT EXISTS ocr_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_id TEXT NOT NULL,
            entity_type TEXT NOT NULL DEFAULT 'note',
            extracted_text TEXT NOT NULL,
            confidence REAL NOT NULL,
            language TEXT NOT NULL DEFAULT 'eng',
            extracted_at TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(entity_id, entity_type)
        )
    `);

    // Create indexes for better search performance
    sql.execute(`
        CREATE INDEX IF NOT EXISTS idx_ocr_results_entity 
        ON ocr_results (entity_id, entity_type)
    `);

    sql.execute(`
        CREATE INDEX IF NOT EXISTS idx_ocr_results_text 
        ON ocr_results (extracted_text)
    `);

    sql.execute(`
        CREATE INDEX IF NOT EXISTS idx_ocr_results_confidence 
        ON ocr_results (confidence)
    `);

    // Create full-text search index for extracted text
    sql.execute(`
        CREATE VIRTUAL TABLE IF NOT EXISTS ocr_results_fts USING fts5(
            entity_id UNINDEXED,
            entity_type UNINDEXED,
            extracted_text,
            content='ocr_results',
            content_rowid='id'
        )
    `);

    // Create triggers to keep FTS table in sync
    sql.execute(`
        CREATE TRIGGER IF NOT EXISTS ocr_results_fts_insert 
        AFTER INSERT ON ocr_results 
        BEGIN
            INSERT INTO ocr_results_fts(rowid, entity_id, entity_type, extracted_text) 
            VALUES (new.id, new.entity_id, new.entity_type, new.extracted_text);
        END
    `);

    sql.execute(`
        CREATE TRIGGER IF NOT EXISTS ocr_results_fts_update 
        AFTER UPDATE ON ocr_results 
        BEGIN
            UPDATE ocr_results_fts 
            SET extracted_text = new.extracted_text 
            WHERE rowid = new.id;
        END
    `);

    sql.execute(`
        CREATE TRIGGER IF NOT EXISTS ocr_results_fts_delete 
        AFTER DELETE ON ocr_results 
        BEGIN
            DELETE FROM ocr_results_fts WHERE rowid = old.id;
        END
    `);
}