import Expression from "./expression.js";
import SearchContext from "../search_context.js";
import NoteSet from "../note_set.js";
import sql from "../../sql.js";
import becca from "../../../becca/becca.js";

/**
 * Search expression for finding text within OCR-extracted content from images
 */
export default class OCRContentExpression extends Expression {
    private searchText: string;

    constructor(searchText: string) {
        super();
        this.searchText = searchText;
    }

    execute(inputNoteSet: NoteSet, executionContext: object, searchContext: SearchContext): NoteSet {
        // Don't search OCR content if it's not enabled
        if (!this.isOCRSearchEnabled()) {
            return new NoteSet();
        }

        const resultNoteSet = new NoteSet();
        const ocrResults = this.searchOCRContent(this.searchText);

        for (const ocrResult of ocrResults) {
            let note: import('../../../becca/entities/bnote.js').default | null = null;
            
            if (ocrResult.entity_type === 'note') {
                note = becca.getNote(ocrResult.entity_id);
            } else if (ocrResult.entity_type === 'attachment') {
                // For attachments, find the parent note
                const attachment = becca.getAttachment(ocrResult.entity_id);
                if (attachment) {
                    note = becca.getNote(attachment.ownerId);
                }
            }

            // Only add notes that are in the input note set and not deleted
            if (note && !note.isDeleted && inputNoteSet.hasNoteId(note.noteId)) {
                resultNoteSet.add(note);
            }
        }

        // Add highlight tokens for OCR matches
        if (ocrResults.length > 0) {
            const tokens = this.extractHighlightTokens(this.searchText);
            searchContext.highlightedTokens.push(...tokens);
        }

        return resultNoteSet;
    }

    private isOCRSearchEnabled(): boolean {
        try {
            const optionService = require('../../options.js').default;
            return optionService.getOptionBool('ocrEnabled');
        } catch {
            return false;
        }
    }

    private searchOCRContent(searchText: string): Array<{
        entity_id: string;
        entity_type: string;
        extracted_text: string;
        confidence: number;
    }> {
        try {
            // Use FTS search if available, otherwise fall back to LIKE
            let query: string;
            let params: unknown[];

            try {
                // Try FTS first
                query = `
                    SELECT ocr.entity_id, ocr.entity_type, ocr.extracted_text, ocr.confidence
                    FROM ocr_results_fts fts
                    JOIN ocr_results ocr ON fts.rowid = ocr.id
                    WHERE ocr_results_fts MATCH ?
                    ORDER BY ocr.confidence DESC, rank
                    LIMIT 50
                `;
                params = [searchText];
            } catch {
                // Fallback to LIKE search
                query = `
                    SELECT entity_id, entity_type, extracted_text, confidence
                    FROM ocr_results
                    WHERE extracted_text LIKE ?
                    ORDER BY confidence DESC
                    LIMIT 50
                `;
                params = [`%${searchText}%`];
            }

            return sql.getRows<{
                entity_id: string;
                entity_type: string;
                extracted_text: string;
                confidence: number;
            }>(query, params);
        } catch (error) {
            console.error('Error searching OCR content:', error);
            return [];
        }
    }


    private extractHighlightTokens(searchText: string): string[] {
        // Split search text into words and return them as highlight tokens
        return searchText
            .split(/\s+/)
            .filter(token => token.length > 2)
            .map(token => token.toLowerCase());
    }

    toString(): string {
        return `OCRContent('${this.searchText}')`;
    }
}