import sql from "../../../services/sql.js";
import dateUtils from "../../../services/date_utils.js";
import log from "../../../services/log.js";
import becca from "../../../becca/becca.js";
import options from "../../../services/options.js";
import { getEnabledEmbeddingProviders } from "./providers.js";
import { getNoteEmbeddingContext } from "./content_processing.js";
import { deleteNoteEmbeddings } from "./storage.js";
import type { QueueItem } from "./types.js";
import { getChunkingOperations } from "./chunking/chunking_interface.js";
import indexService from '../index_service.js';

/**
 * Queues a note for embedding update
 */
export async function queueNoteForEmbedding(noteId: string, operation = 'UPDATE') {
    const now = dateUtils.localNowDateTime();
    const utcNow = dateUtils.utcNowDateTime();

    // Check if note is already in queue and whether it's marked as permanently failed
    const queueInfo = await sql.getRow(
        "SELECT 1 as exists, failed FROM embedding_queue WHERE noteId = ?",
        [noteId]
    ) as {exists: number, failed: number} | null;

    if (queueInfo) {
        // Only update if not permanently failed
        if (queueInfo.failed !== 1) {
            // Update existing queue entry but preserve the failed status
            await sql.execute(`
                UPDATE embedding_queue
                SET operation = ?, dateQueued = ?, utcDateQueued = ?, attempts = 0, error = NULL
                WHERE noteId = ?`,
                [operation, now, utcNow, noteId]
            );
        } else {
            // Note is marked as permanently failed, don't update
            log.info(`Note ${noteId} is marked as permanently failed, skipping automatic re-queue`);
        }
    } else {
        // Add new queue entry
        await sql.execute(`
            INSERT INTO embedding_queue
            (noteId, operation, dateQueued, utcDateQueued, failed)
            VALUES (?, ?, ?, ?, 0)`,
            [noteId, operation, now, utcNow]
        );
    }
}

/**
 * Get notes that have failed embedding generation
 *
 * @param limit - Maximum number of failed notes to return
 * @returns List of failed notes with their error information
 */
export async function getFailedEmbeddingNotes(limit: number = 100): Promise<any[]> {
    // Get notes with failed embedding attempts or permanently failed flag
    const failedQueueItems = await sql.getRows(`
        SELECT noteId, operation, attempts, lastAttempt, error, failed
        FROM embedding_queue
        WHERE attempts > 0 OR failed = 1
        ORDER BY failed DESC, attempts DESC, lastAttempt DESC
        LIMIT ?`,
        [limit]
    ) as {noteId: string, operation: string, attempts: number, lastAttempt: string, error: string, failed: number}[];

    // Add titles to the failed notes
    const failedNotesWithTitles = [];
    for (const item of failedQueueItems) {
        const note = becca.getNote(item.noteId);
        if (note) {
            // Check if this is a chunking error (contains the word "chunks")
            const isChunkFailure = item.error && item.error.toLowerCase().includes('chunk');
            const isPermanentFailure = item.failed === 1;

            failedNotesWithTitles.push({
                ...item,
                title: note.title,
                failureType: isChunkFailure ? 'chunks' : 'full',
                isPermanent: isPermanentFailure
            });
        } else {
            failedNotesWithTitles.push({
                ...item,
                failureType: 'full',
                isPermanent: item.failed === 1
            });
        }
    }

    // Sort by latest attempt
    failedNotesWithTitles.sort((a, b) => {
        if (a.lastAttempt && b.lastAttempt) {
            return b.lastAttempt.localeCompare(a.lastAttempt);
        }
        return 0;
    });

    // Limit to the specified number
    return failedNotesWithTitles.slice(0, limit);
}

/**
 * Retry a specific failed note embedding
 */
export async function retryFailedEmbedding(noteId: string): Promise<boolean> {
    const now = dateUtils.localNowDateTime();
    const utcNow = dateUtils.utcNowDateTime();

    // Check if the note is in the embedding queue and has failed or has attempts
    const existsInQueue = await sql.getValue(
        "SELECT 1 FROM embedding_queue WHERE noteId = ? AND (failed = 1 OR attempts > 0)",
        [noteId]
    );

    if (existsInQueue) {
        // Reset the note in the queue
        await sql.execute(`
            UPDATE embedding_queue
            SET attempts = 0, error = NULL, failed = 0, dateQueued = ?, utcDateQueued = ?, priority = 10
            WHERE noteId = ?`,
            [now, utcNow, noteId]
        );
        return true;
    }

    return false;
}

/**
 * Retry all failed embeddings
 *
 * @returns Number of notes queued for retry
 */
export async function retryAllFailedEmbeddings(): Promise<number> {
    const now = dateUtils.localNowDateTime();
    const utcNow = dateUtils.utcNowDateTime();

    // Get count of all failed notes in queue (either with failed=1 or attempts>0)
    const failedCount = await sql.getValue(
        "SELECT COUNT(*) FROM embedding_queue WHERE failed = 1 OR attempts > 0"
    ) as number;

    if (failedCount > 0) {
        // Reset all failed notes in the queue
        await sql.execute(`
            UPDATE embedding_queue
            SET attempts = 0, error = NULL, failed = 0, dateQueued = ?, utcDateQueued = ?, priority = 10
            WHERE failed = 1 OR attempts > 0`,
            [now, utcNow]
        );
    }

    return failedCount;
}

/**
 * Process the embedding queue
 */
export async function processEmbeddingQueue() {
    if (!(await options.getOptionBool('aiEnabled'))) {
        return;
    }

    // Check if this instance should process embeddings
    const embeddingLocation = await options.getOption('embeddingGenerationLocation') || 'client';
    const isSyncServer = await indexService.isSyncServerForEmbeddings();
    const shouldProcessEmbeddings = embeddingLocation === 'client' || isSyncServer;

    if (!shouldProcessEmbeddings) {
        // This instance is not configured to process embeddings
        return;
    }

    const batchSize = parseInt(await options.getOption('embeddingBatchSize') || '10', 10);
    const enabledProviders = await getEnabledEmbeddingProviders();

    if (enabledProviders.length === 0) {
        return;
    }

    // Get notes from queue (excluding failed ones)
    const notes = await sql.getRows(`
        SELECT noteId, operation, attempts
        FROM embedding_queue
        WHERE failed = 0
        ORDER BY priority DESC, utcDateQueued ASC
        LIMIT ?`,
        [batchSize]
    );

    if (notes.length === 0) {
        return;
    }

    // Track successfully processed notes count for progress reporting
    let processedCount = 0;

    for (const note of notes) {
        try {
            const noteData = note as unknown as QueueItem;

            // Skip if note no longer exists
            if (!becca.getNote(noteData.noteId)) {
                await sql.execute(
                    "DELETE FROM embedding_queue WHERE noteId = ?",
                    [noteData.noteId]
                );
                await deleteNoteEmbeddings(noteData.noteId);
                continue;
            }

            if (noteData.operation === 'DELETE') {
                await deleteNoteEmbeddings(noteData.noteId);
                await sql.execute(
                    "DELETE FROM embedding_queue WHERE noteId = ?",
                    [noteData.noteId]
                );
                continue;
            }

            // Get note context for embedding
            const context = await getNoteEmbeddingContext(noteData.noteId);

            // Check if we should use chunking for large content
            const useChunking = context.content.length > 5000;

            // Track provider successes and failures
            let allProvidersFailed = true;
            let allProvidersSucceeded = true;

            // Process with each enabled provider
            for (const provider of enabledProviders) {
                try {
                    if (useChunking) {
                        // Process large notes using chunking
                        const chunkingOps = await getChunkingOperations();
                        await chunkingOps.processNoteWithChunking(noteData.noteId, provider, context);
                        allProvidersFailed = false;
                    } else {
                        // Standard approach: Generate a single embedding for the whole note
                        const embedding = await provider.generateNoteEmbeddings(context);

                        // Store embedding
                        const config = provider.getConfig();
                        await import('./storage.js').then(storage => {
                            return storage.storeNoteEmbedding(
                                noteData.noteId,
                                provider.name,
                                config.model,
                                embedding
                            );
                        });

                        // At least one provider succeeded
                        allProvidersFailed = false;
                    }
                } catch (providerError: any) {
                    // This provider failed
                    allProvidersSucceeded = false;
                    log.error(`Error generating embedding with provider ${provider.name} for note ${noteData.noteId}: ${providerError.message || 'Unknown error'}`);
                }
            }

            if (!allProvidersFailed) {
                // At least one provider succeeded, remove from queue
                await sql.execute(
                    "DELETE FROM embedding_queue WHERE noteId = ?",
                    [noteData.noteId]
                );
                // Count as successfully processed
                processedCount++;
            } else {
                // If all providers failed, mark as failed but keep in queue
                await sql.execute(`
                    UPDATE embedding_queue
                    SET attempts = attempts + 1,
                        lastAttempt = ?,
                        error = ?
                    WHERE noteId = ?`,
                    [dateUtils.utcNowDateTime(), "All providers failed to generate embeddings", noteData.noteId]
                );

                // Mark as permanently failed if too many attempts
                if (noteData.attempts + 1 >= 3) {
                    log.error(`Marked note ${noteData.noteId} as permanently failed after multiple embedding attempts`);

                    // Set the failed flag but keep the actual attempts count
                    await sql.execute(`
                        UPDATE embedding_queue
                        SET failed = 1
                        WHERE noteId = ?
                    `, [noteData.noteId]);
                }
            }
        } catch (error: any) {
            const noteData = note as unknown as QueueItem;

            // Update attempt count and log error
            await sql.execute(`
                UPDATE embedding_queue
                SET attempts = attempts + 1,
                    lastAttempt = ?,
                    error = ?
                WHERE noteId = ?`,
                [dateUtils.utcNowDateTime(), error.message || 'Unknown error', noteData.noteId]
            );

            log.error(`Error processing embedding for note ${noteData.noteId}: ${error.message || 'Unknown error'}`);

            // Mark as permanently failed if too many attempts
            if (noteData.attempts + 1 >= 3) {
                log.error(`Marked note ${noteData.noteId} as permanently failed after multiple embedding attempts`);

                // Set the failed flag but keep the actual attempts count
                await sql.execute(`
                    UPDATE embedding_queue
                    SET failed = 1
                    WHERE noteId = ?
                `, [noteData.noteId]);
            }
        }
    }

    // Update the index rebuild progress if any notes were processed
    if (processedCount > 0) {
        indexService.updateIndexRebuildProgress(processedCount);
    }
}
