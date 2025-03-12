import log from "../../../services/log.js";
import dateUtils from "../../../services/date_utils.js";
import sql from "../../../services/sql.js";
import becca from "../../../becca/becca.js";
import type { NoteEmbeddingContext } from "./types.js";
// Remove static imports that cause circular dependencies
// import { storeNoteEmbedding, deleteNoteEmbeddings } from "./storage.js";

/**
 * Process a large note by breaking it into chunks and creating embeddings for each chunk
 * This provides more detailed and focused embeddings for different parts of large notes
 *
 * @param noteId - The ID of the note to process
 * @param provider - The embedding provider to use
 * @param context - The note context data
 */
export async function processNoteWithChunking(
    noteId: string,
    provider: any,
    context: NoteEmbeddingContext
): Promise<void> {
    try {
        // Get the context extractor dynamically to avoid circular dependencies
        const { ContextExtractor } = await import('../context/index.js');
        const contextExtractor = new ContextExtractor();

        // Get note from becca
        const note = becca.notes[noteId];
        if (!note) {
            throw new Error(`Note ${noteId} not found in Becca cache`);
        }

        // Use semantic chunking for better boundaries
        const chunks = await contextExtractor.semanticChunking(
            context.content,
            note.title,
            noteId,
            {
                // Adjust chunk size based on provider using constants
                maxChunkSize: provider.name === 'ollama' ?
                    (await import('../../../routes/api/llm.js')).LLM_CONSTANTS.CHUNKING.OLLAMA_SIZE :
                    (await import('../../../routes/api/llm.js')).LLM_CONSTANTS.CHUNKING.DEFAULT_SIZE,
                respectBoundaries: true
            }
        );

        if (!chunks || chunks.length === 0) {
            // Fall back to single embedding if chunking fails
            const embedding = await provider.generateEmbeddings(context.content);
            const config = provider.getConfig();

            // Use dynamic import instead of static import
            const storage = await import('./storage.js');
            await storage.storeNoteEmbedding(noteId, provider.name, config.model, embedding);

            log.info(`Generated single embedding for note ${noteId} (${note.title}) since chunking failed`);
            return;
        }

        // Generate and store embeddings for each chunk
        const config = provider.getConfig();

        // Delete existing embeddings first to avoid duplicates
        // Use dynamic import
        const storage = await import('./storage.js');
        await storage.deleteNoteEmbeddings(noteId, provider.name, config.model);

        // Track successful and failed chunks in memory during this processing run
        let successfulChunks = 0;
        let failedChunks = 0;
        const totalChunks = chunks.length;
        const failedChunkDetails: {index: number, error: string}[] = [];
        const retryQueue: {index: number, chunk: any}[] = [];

        log.info(`Processing ${chunks.length} chunks for note ${noteId} (${note.title})`);

        // Process each chunk with a delay based on provider to avoid rate limits
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
                // Generate embedding for this chunk's content
                const embedding = await provider.generateEmbeddings(chunk.content);

                // Store with chunk information in a unique ID format
                const chunkIdSuffix = `${i + 1}_of_${chunks.length}`;
                await storage.storeNoteEmbedding(
                    noteId,
                    provider.name,
                    config.model,
                    embedding
                );

                successfulChunks++;

                // Small delay between chunks to avoid rate limits - longer for Ollama
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve,
                        provider.name === 'ollama' ? 500 : 100));
                }
            } catch (error: any) {
                // Track the failure for this specific chunk
                failedChunks++;
                failedChunkDetails.push({
                    index: i + 1,
                    error: error.message || 'Unknown error'
                });

                // Add to retry queue
                retryQueue.push({
                    index: i,
                    chunk: chunk
                });

                log.error(`Error processing chunk ${i + 1} for note ${noteId}: ${error.message || 'Unknown error'}`);
            }
        }

        // Retry failed chunks with exponential backoff
        if (retryQueue.length > 0 && retryQueue.length < chunks.length) {
            log.info(`Retrying ${retryQueue.length} failed chunks for note ${noteId}`);

            for (let j = 0; j < retryQueue.length; j++) {
                const {index, chunk} = retryQueue[j];

                try {
                    // Wait longer for retries with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(1.5, j)));

                    // Retry the embedding
                    const embedding = await provider.generateEmbeddings(chunk.content);

                    // Store with unique ID that indicates it was a retry
                    const chunkIdSuffix = `${index + 1}_of_${chunks.length}`;
                    await storage.storeNoteEmbedding(
                        noteId,
                        provider.name,
                        config.model,
                        embedding
                    );

                    // Update counters
                    successfulChunks++;
                    failedChunks--;

                    // Remove from failedChunkDetails
                    const detailIndex = failedChunkDetails.findIndex(d => d.index === index + 1);
                    if (detailIndex >= 0) {
                        failedChunkDetails.splice(detailIndex, 1);
                    }
                } catch (error: any) {
                    log.error(`Retry failed for chunk ${index + 1} of note ${noteId}: ${error.message || 'Unknown error'}`);
                    // Keep failure count as is
                }
            }
        }

        // Log information about the processed chunks
        if (successfulChunks > 0) {
            log.info(`Generated ${successfulChunks} chunk embeddings for note ${noteId} (${note.title})`);
        }

        if (failedChunks > 0) {
            log.info(`Failed to generate ${failedChunks} chunk embeddings for note ${noteId} (${note.title})`);
        }

        // If no chunks were successfully processed, throw an error
        // This will keep the note in the queue for another attempt
        if (successfulChunks === 0 && failedChunks > 0) {
            throw new Error(`All ${failedChunks} chunks failed for note ${noteId}. First error: ${failedChunkDetails[0]?.error}`);
        }

        // If some chunks failed but others succeeded, log a warning but consider the processing complete
        // The note will be removed from the queue, but we'll store error information
        if (failedChunks > 0 && successfulChunks > 0) {
            const errorSummary = `Note processed partially: ${successfulChunks}/${totalChunks} chunks succeeded, ${failedChunks}/${totalChunks} failed`;
            log.info(errorSummary);

            // Store a summary in the error field of embedding_queue
            // This is just for informational purposes - the note will be removed from the queue
            const now = dateUtils.utcNowDateTime();
            await sql.execute(`
                UPDATE embedding_queue
                SET error = ?, lastAttempt = ?
                WHERE noteId = ?
            `, [errorSummary, now, noteId]);
        }

    } catch (error: any) {
        log.error(`Error in chunked embedding process for note ${noteId}: ${error.message || 'Unknown error'}`);
        throw error;
    }
}
