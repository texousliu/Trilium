import Tesseract from 'tesseract.js';
import log from '../log.js';
import sql from '../sql.js';
import becca from '../../becca/becca.js';
import options from '../options.js';

export interface OCRResult {
    text: string;
    confidence: number;
    extractedAt: string;
    language?: string;
}

export interface OCRProcessingOptions {
    language?: string;
    forceReprocess?: boolean;
    confidence?: number;
}

interface OCRResultRow {
    entity_id: string;
    entity_type: string;
    extracted_text: string;
    confidence: number;
}

/**
 * OCR Service for extracting text from images and other OCR-able objects
 * Uses Tesseract.js for text recognition
 */
class OCRService {
    private isInitialized = false;
    private worker: Tesseract.Worker | null = null;
    private isProcessing = false;

    /**
     * Initialize the OCR service
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            log.info('Initializing OCR service with Tesseract.js...');
            
            // Configure proper paths for Node.js environment
            const tesseractDir = require.resolve('tesseract.js').replace('/src/index.js', '');
            const workerPath = require.resolve('tesseract.js/src/worker-script/node/index.js');
            const corePath = require.resolve('tesseract.js-core/tesseract-core.wasm.js');
            
            log.info(`Using worker path: ${workerPath}`);
            log.info(`Using core path: ${corePath}`);
            
            this.worker = await Tesseract.createWorker('eng', 1, {
                workerPath,
                corePath,
                logger: (m: { status: string; progress: number }) => {
                    if (m.status === 'recognizing text') {
                        log.info(`OCR progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            this.isInitialized = true;
            log.info('OCR service initialized successfully');
        } catch (error) {
            log.error(`Failed to initialize OCR service: ${error}`);
            throw error;
        }
    }

    /**
     * Check if OCR is enabled in settings
     */
    isOCREnabled(): boolean {
        try {
            return options.getOptionBool('ocrEnabled');
        } catch (error) {
            log.error(`Failed to check OCR enabled status: ${error}`);
            return false;
        }
    }

    /**
     * Check if a MIME type is supported for OCR
     */
    isSupportedMimeType(mimeType: string): boolean {
        if (!mimeType || typeof mimeType !== 'string') {
            return false;
        }
        
        const supportedTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/gif',
            'image/bmp',
            'image/tiff',
            'image/webp'
        ];
        return supportedTypes.includes(mimeType.toLowerCase());
    }

    /**
     * Extract text from image buffer
     */
    async extractTextFromImage(imageBuffer: Buffer, options: OCRProcessingOptions = {}): Promise<OCRResult> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.worker) {
            throw new Error('OCR worker not initialized');
        }

        try {
            log.info('Starting OCR text extraction...');
            this.isProcessing = true;

            // Set language if specified and different from current
            const language = options.language || 'eng';
            if (language !== 'eng') {
                // For different languages, create a new worker
                await this.worker.terminate();
                this.worker = await Tesseract.createWorker(language, 1, {
                    logger: (m: { status: string; progress: number }) => {
                        if (m.status === 'recognizing text') {
                            log.info(`OCR progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                });
            }

            const result = await this.worker.recognize(imageBuffer);
            
            const ocrResult: OCRResult = {
                text: result.data.text.trim(),
                confidence: result.data.confidence / 100,  // Convert percentage to decimal
                extractedAt: new Date().toISOString(),
                language: options.language || 'eng'
            };

            log.info(`OCR extraction completed. Confidence: ${ocrResult.confidence}%, Text length: ${ocrResult.text.length}`);
            return ocrResult;

        } catch (error) {
            log.error(`OCR text extraction failed: ${error}`);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process OCR for a note (image type)
     */
    async processNoteOCR(noteId: string, options: OCRProcessingOptions = {}): Promise<OCRResult | null> {
        if (!this.isOCREnabled()) {
            log.info('OCR is disabled in settings');
            return null;
        }

        const note = becca.getNote(noteId);
        if (!note) {
            log.error(`Note ${noteId} not found`);
            return null;
        }

        if (note.type !== 'image') {
            log.info(`Note ${noteId} is not an image note, skipping OCR`);
            return null;
        }

        if (!this.isSupportedMimeType(note.mime)) {
            log.info(`Note ${noteId} has unsupported MIME type ${note.mime}, skipping OCR`);
            return null;
        }

        // Check if OCR already exists and we're not forcing reprocessing
        const existingOCR = this.getStoredOCRResult(noteId);
        if (existingOCR && !options.forceReprocess) {
            log.info(`OCR already exists for note ${noteId}, returning cached result`);
            return existingOCR;
        }

        try {
            const content = note.getContent();
            if (!content || !(content instanceof Buffer)) {
                throw new Error(`Cannot get image content for note ${noteId}`);
            }

            const ocrResult = await this.extractTextFromImage(content, options);
            
            // Store OCR result
            await this.storeOCRResult(noteId, ocrResult);
            
            return ocrResult;
        } catch (error) {
            log.error(`Failed to process OCR for note ${noteId}: ${error}`);
            throw error;
        }
    }

    /**
     * Process OCR for an attachment
     */
    async processAttachmentOCR(attachmentId: string, options: OCRProcessingOptions = {}): Promise<OCRResult | null> {
        if (!this.isOCREnabled()) {
            log.info('OCR is disabled in settings');
            return null;
        }

        const attachment = becca.getAttachment(attachmentId);
        if (!attachment) {
            log.error(`Attachment ${attachmentId} not found`);
            return null;
        }

        if (attachment.role !== 'image') {
            log.info(`Attachment ${attachmentId} is not an image, skipping OCR`);
            return null;
        }

        if (!this.isSupportedMimeType(attachment.mime)) {
            log.info(`Attachment ${attachmentId} has unsupported MIME type ${attachment.mime}, skipping OCR`);
            return null;
        }

        // Check if OCR already exists and we're not forcing reprocessing
        const existingOCR = this.getStoredOCRResult(attachmentId, 'attachment');
        if (existingOCR && !options.forceReprocess) {
            log.info(`OCR already exists for attachment ${attachmentId}, returning cached result`);
            return existingOCR;
        }

        try {
            const content = attachment.getContent();
            if (!content || !(content instanceof Buffer)) {
                throw new Error(`Cannot get image content for attachment ${attachmentId}`);
            }

            const ocrResult = await this.extractTextFromImage(content, options);
            
            // Store OCR result
            await this.storeOCRResult(attachmentId, ocrResult, 'attachment');
            
            return ocrResult;
        } catch (error) {
            log.error(`Failed to process OCR for attachment ${attachmentId}: ${error}`);
            throw error;
        }
    }

    /**
     * Store OCR result in database
     */
    async storeOCRResult(entityId: string, ocrResult: OCRResult, entityType: 'note' | 'attachment' = 'note'): Promise<void> {
        try {
            sql.execute(`
                INSERT OR REPLACE INTO ocr_results (entity_id, entity_type, extracted_text, confidence, language, extracted_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                entityId,
                entityType,
                ocrResult.text,
                ocrResult.confidence,
                ocrResult.language || 'eng',
                ocrResult.extractedAt
            ]);
            
            log.info(`Stored OCR result for ${entityType} ${entityId}`);
        } catch (error) {
            log.error(`Failed to store OCR result for ${entityType} ${entityId}: ${error}`);
            throw error;
        }
    }

    /**
     * Get stored OCR result from database
     */
    private getStoredOCRResult(entityId: string, entityType: 'note' | 'attachment' = 'note'): OCRResult | null {
        try {
            const row = sql.getRow<{
                extracted_text: string;
                confidence: number;
                language?: string;
                extracted_at: string;
            }>(`
                SELECT extracted_text, confidence, language, extracted_at
                FROM ocr_results 
                WHERE entity_id = ? AND entity_type = ?
            `, [entityId, entityType]);
            
            if (!row) {
                return null;
            }
            
            return {
                text: row.extracted_text,
                confidence: row.confidence,
                language: row.language,
                extractedAt: row.extracted_at
            };
        } catch (error) {
            log.error(`Failed to get OCR result for ${entityType} ${entityId}: ${error}`);
            return null;
        }
    }

    /**
     * Search for text in OCR results
     */
    searchOCRResults(searchText: string, entityType?: 'note' | 'attachment'): Array<{ entityId: string; entityType: string; text: string; confidence: number }> {
        try {
            let query = `
                SELECT entity_id, entity_type, extracted_text, confidence
                FROM ocr_results 
                WHERE extracted_text LIKE ?
            `;
            const params = [`%${searchText}%`];
            
            if (entityType) {
                query += ' AND entity_type = ?';
                params.push(entityType);
            }
            
            query += ' ORDER BY confidence DESC';
            
            const rows = sql.getRows<OCRResultRow>(query, params);
            
            return rows.map(row => ({
                entityId: row.entity_id,
                entityType: row.entity_type,
                text: row.extracted_text,
                confidence: row.confidence
            }));
        } catch (error) {
            log.error(`Failed to search OCR results: ${error}`);
            return [];
        }
    }

    /**
     * Delete OCR results for an entity
     */
    deleteOCRResult(entityId: string, entityType: 'note' | 'attachment' = 'note'): void {
        try {
            sql.execute(`
                DELETE FROM ocr_results 
                WHERE entity_id = ? AND entity_type = ?
            `, [entityId, entityType]);
            
            log.info(`Deleted OCR result for ${entityType} ${entityId}`);
        } catch (error) {
            log.error(`Failed to delete OCR result for ${entityType} ${entityId}: ${error}`);
            throw error;
        }
    }

    /**
     * Process OCR for all images that don't have OCR results yet
     */
    async processAllImages(): Promise<void> {
        if (!this.isOCREnabled()) {
            log.info('OCR is disabled, skipping batch processing');
            return;
        }

        log.info('Starting batch OCR processing for all images...');

        try {
            // Process image notes
            const imageNotes = sql.getRows<{
                noteId: string;
                mime: string;
            }>(`
                SELECT noteId, mime
                FROM notes 
                WHERE type = 'image' 
                AND isDeleted = 0
                AND noteId NOT IN (
                    SELECT entity_id FROM ocr_results WHERE entity_type = 'note'
                )
            `);

            log.info(`Found ${imageNotes.length} image notes to process`);

            for (const noteRow of imageNotes) {
                if (this.isSupportedMimeType(noteRow.mime)) {
                    try {
                        await this.processNoteOCR(noteRow.noteId);
                        // Add small delay to prevent overwhelming the system
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        log.error(`Failed to process OCR for note ${noteRow.noteId}: ${error}`);
                    }
                }
            }

            // Process image attachments
            const imageAttachments = sql.getRows<{
                attachmentId: string;
                mime: string;
            }>(`
                SELECT attachmentId, mime
                FROM attachments 
                WHERE role = 'image'
                AND isDeleted = 0
                AND attachmentId NOT IN (
                    SELECT entity_id FROM ocr_results WHERE entity_type = 'attachment'
                )
            `);

            log.info(`Found ${imageAttachments.length} image attachments to process`);

            for (const attachmentRow of imageAttachments) {
                if (this.isSupportedMimeType(attachmentRow.mime)) {
                    try {
                        await this.processAttachmentOCR(attachmentRow.attachmentId);
                        // Add small delay to prevent overwhelming the system
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        log.error(`Failed to process OCR for attachment ${attachmentRow.attachmentId}: ${error}`);
                    }
                }
            }

            log.info('Batch OCR processing completed');
        } catch (error) {
            log.error(`Batch OCR processing failed: ${error}`);
            throw error;
        }
    }

    /**
     * Get OCR statistics
     */
    getOCRStats(): { totalProcessed: number; averageConfidence: number; byEntityType: Record<string, number> } {
        try {
            const stats = sql.getRow<{
                total_processed: number;
                avg_confidence: number;
            }>(`
                SELECT 
                    COUNT(*) as total_processed,
                    AVG(confidence) as avg_confidence
                FROM ocr_results
            `);

            const byEntityType = sql.getRows<{
                entity_type: string;
                count: number;
            }>(`
                SELECT entity_type, COUNT(*) as count
                FROM ocr_results
                GROUP BY entity_type
            `);

            return {
                totalProcessed: stats?.total_processed || 0,
                averageConfidence: stats?.avg_confidence || 0,
                byEntityType: byEntityType.reduce((acc, row) => {
                    acc[row.entity_type] = row.count;
                    return acc;
                }, {} as Record<string, number>)
            };
        } catch (error) {
            log.error(`Failed to get OCR stats: ${error}`);
            return { totalProcessed: 0, averageConfidence: 0, byEntityType: {} };
        }
    }

    /**
     * Clean up OCR service
     */
    async cleanup(): Promise<void> {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
        this.isInitialized = false;
        log.info('OCR service cleaned up');
    }

    /**
     * Check if currently processing
     */
    isCurrentlyProcessing(): boolean {
        return this.isProcessing;
    }

    // Batch processing state
    private batchProcessingState: {
        inProgress: boolean;
        total: number;
        processed: number;
        startTime?: Date;
    } = {
        inProgress: false,
        total: 0,
        processed: 0
    };

    /**
     * Start batch OCR processing with progress tracking
     */
    async startBatchProcessing(): Promise<{ success: boolean; message?: string }> {
        if (this.batchProcessingState.inProgress) {
            return { success: false, message: 'Batch processing already in progress' };
        }

        if (!this.isOCREnabled()) {
            return { success: false, message: 'OCR is disabled' };
        }

        try {
            // Count total images to process
            const imageNotesCount = sql.getRow<{ count: number }>(`
                SELECT COUNT(*) as count
                FROM notes 
                WHERE type = 'image' 
                AND isDeleted = 0
                AND noteId NOT IN (
                    SELECT entity_id FROM ocr_results WHERE entity_type = 'note'
                )
            `)?.count || 0;

            const imageAttachmentsCount = sql.getRow<{ count: number }>(`
                SELECT COUNT(*) as count
                FROM attachments 
                WHERE role = 'image'
                AND isDeleted = 0
                AND attachmentId NOT IN (
                    SELECT entity_id FROM ocr_results WHERE entity_type = 'attachment'
                )
            `)?.count || 0;

            const totalCount = imageNotesCount + imageAttachmentsCount;

            if (totalCount === 0) {
                return { success: false, message: 'No images found that need OCR processing' };
            }

            // Initialize batch processing state
            this.batchProcessingState = {
                inProgress: true,
                total: totalCount,
                processed: 0,
                startTime: new Date()
            };

            // Start processing in background
            this.processBatchInBackground().catch(error => {
                log.error(`Batch processing failed: ${error instanceof Error ? error.message : String(error)}`);
                this.batchProcessingState.inProgress = false;
            });

            return { success: true };
        } catch (error) {
            log.error(`Failed to start batch processing: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, message: error instanceof Error ? error.message : String(error) };
        }
    }

    /**
     * Get batch processing progress
     */
    getBatchProgress(): { inProgress: boolean; total: number; processed: number; percentage?: number; startTime?: Date } {
        const result: { inProgress: boolean; total: number; processed: number; percentage?: number; startTime?: Date } = { ...this.batchProcessingState };
        if (result.total > 0) {
            result.percentage = (result.processed / result.total) * 100;
        }
        return result;
    }

    /**
     * Process batch OCR in background with progress tracking
     */
    private async processBatchInBackground(): Promise<void> {
        try {
            log.info('Starting batch OCR processing...');

            // Process image notes
            const imageNotes = sql.getRows<{
                noteId: string;
                mime: string;
            }>(`
                SELECT noteId, mime
                FROM notes 
                WHERE type = 'image' 
                AND isDeleted = 0
                AND noteId NOT IN (
                    SELECT entity_id FROM ocr_results WHERE entity_type = 'note'
                )
            `);

            for (const noteRow of imageNotes) {
                if (!this.batchProcessingState.inProgress) {
                    break; // Stop if processing was cancelled
                }

                if (this.isSupportedMimeType(noteRow.mime)) {
                    try {
                        await this.processNoteOCR(noteRow.noteId);
                        this.batchProcessingState.processed++;
                        // Add small delay to prevent overwhelming the system
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        log.error(`Failed to process OCR for note ${noteRow.noteId}: ${error}`);
                        this.batchProcessingState.processed++; // Count as processed even if failed
                    }
                }
            }

            // Process image attachments
            const imageAttachments = sql.getRows<{
                attachmentId: string;
                mime: string;
            }>(`
                SELECT attachmentId, mime
                FROM attachments 
                WHERE role = 'image'
                AND isDeleted = 0
                AND attachmentId NOT IN (
                    SELECT entity_id FROM ocr_results WHERE entity_type = 'attachment'
                )
            `);

            for (const attachmentRow of imageAttachments) {
                if (!this.batchProcessingState.inProgress) {
                    break; // Stop if processing was cancelled
                }

                if (this.isSupportedMimeType(attachmentRow.mime)) {
                    try {
                        await this.processAttachmentOCR(attachmentRow.attachmentId);
                        this.batchProcessingState.processed++;
                        // Add small delay to prevent overwhelming the system
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        log.error(`Failed to process OCR for attachment ${attachmentRow.attachmentId}: ${error}`);
                        this.batchProcessingState.processed++; // Count as processed even if failed
                    }
                }
            }

            // Mark as completed
            this.batchProcessingState.inProgress = false;
            log.info(`Batch OCR processing completed. Processed ${this.batchProcessingState.processed} images.`);
        } catch (error) {
            log.error(`Batch OCR processing failed: ${error}`);
            this.batchProcessingState.inProgress = false;
            throw error;
        }
    }

    /**
     * Cancel batch processing
     */
    cancelBatchProcessing(): void {
        if (this.batchProcessingState.inProgress) {
            this.batchProcessingState.inProgress = false;
            log.info('Batch OCR processing cancelled');
        }
    }
}

export default new OCRService();