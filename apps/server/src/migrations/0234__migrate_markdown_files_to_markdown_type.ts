/**
 * Migrate old text/markdown files to the new markdown note type.
 *
 * Before this migration, markdown files were stored as type='file' with mime='text/markdown'.
 * After this migration, they will be type='markdown' with mime='text/html'.
 */

import sql from "../services/sql.js";
import log from "../services/log.js";

interface MarkdownFileRow {
    noteId: string;
    title: string;
    mime: string;
}

export default function migrate() {
    log.info("Starting migration: Converting text/markdown files to markdown note type");

    // Find all notes that are markdown files
    const markdownFiles = sql.getRows<MarkdownFileRow>(`
        SELECT noteId, title, mime
        FROM notes
        WHERE type = 'file'
        AND (mime = 'text/markdown' OR mime = 'text/x-markdown' OR mime = 'text/mdx')
        AND isDeleted = 0
    `);

    log.info(`Found ${markdownFiles.length} markdown files to migrate`);

    for (const note of markdownFiles) {
        try {
            // Update the note type to 'markdown' and mime to 'text/html'
            sql.execute(`
                UPDATE notes
                SET type = 'markdown',
                    mime = 'text/html'
                WHERE noteId = ?
            `, [note.noteId]);

            // Also update any revisions of this note
            sql.execute(`
                UPDATE revisions
                SET type = 'markdown',
                    mime = 'text/html'
                WHERE noteId = ?
            `, [note.noteId]);

            log.info(`Migrated markdown file: ${note.title} (${note.noteId})`);
        } catch (error) {
            log.error(`Failed to migrate markdown file ${note.noteId}: ${error}`);
            throw error;
        }
    }

    log.info(`Successfully migrated ${markdownFiles.length} markdown files to markdown note type`);
}
