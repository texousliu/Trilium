import sql from "../../../services/sql.js";
import { randomString } from "../../../services/utils.js";
import dateUtils from "../../../services/date_utils.js";
import log from "../../../services/log.js";
import { embeddingToBuffer, bufferToEmbedding, cosineSimilarity } from "./vector_utils.js";
import type { EmbeddingResult } from "./types.js";
import entityChangesService from "../../../services/entity_changes.js";
import type { EntityChange } from "../../../services/entity_changes_interface.js";

/**
 * Creates or updates an embedding for a note
 */
export async function storeNoteEmbedding(
    noteId: string,
    providerId: string,
    modelId: string,
    embedding: Float32Array
): Promise<string> {
    const dimension = embedding.length;
    const embeddingBlob = embeddingToBuffer(embedding);
    const now = dateUtils.localNowDateTime();
    const utcNow = dateUtils.utcNowDateTime();

    // Check if an embedding already exists for this note and provider/model
    const existingEmbed = await getEmbeddingForNote(noteId, providerId, modelId);
    let embedId;

    if (existingEmbed) {
        // Update existing embedding
        embedId = existingEmbed.embedId;
        await sql.execute(`
            UPDATE note_embeddings
            SET embedding = ?, dimension = ?, version = version + 1,
                dateModified = ?, utcDateModified = ?
            WHERE embedId = ?`,
            [embeddingBlob, dimension, now, utcNow, embedId]
        );
    } else {
        // Create new embedding
        embedId = randomString(16);
        await sql.execute(`
            INSERT INTO note_embeddings
            (embedId, noteId, providerId, modelId, dimension, embedding,
             dateCreated, utcDateCreated, dateModified, utcDateModified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [embedId, noteId, providerId, modelId, dimension, embeddingBlob,
             now, utcNow, now, utcNow]
        );
    }

    // Create entity change record for syncing
    interface EmbeddingRow {
        embedId: string;
        noteId: string;
        providerId: string;
        modelId: string;
        dimension: number;
        version: number;
        dateCreated: string;
        utcDateCreated: string;
        dateModified: string;
        utcDateModified: string;
    }

    const row = await sql.getRow<EmbeddingRow>(`
        SELECT embedId, noteId, providerId, modelId, dimension, version,
               dateCreated, utcDateCreated, dateModified, utcDateModified
        FROM note_embeddings
        WHERE embedId = ?`,
        [embedId]
    );

    if (row) {
        // Skip the actual embedding data for the hash since it's large
        const ec: EntityChange = {
            entityName: "note_embeddings",
            entityId: embedId,
            hash: `${row.noteId}|${row.providerId}|${row.modelId}|${row.dimension}|${row.version}|${row.utcDateModified}`,
            utcDateChanged: row.utcDateModified,
            isSynced: true,
            isErased: false
        };

        entityChangesService.putEntityChange(ec);
    }

    return embedId;
}

/**
 * Retrieves embedding for a specific note
 */
export async function getEmbeddingForNote(noteId: string, providerId: string, modelId: string): Promise<EmbeddingResult | null> {
    const row = await sql.getRow(`
        SELECT embedId, noteId, providerId, modelId, dimension, embedding, version,
               dateCreated, utcDateCreated, dateModified, utcDateModified
        FROM note_embeddings
        WHERE noteId = ? AND providerId = ? AND modelId = ?`,
        [noteId, providerId, modelId]
    );

    if (!row) {
        return null;
    }

    // Need to cast row to any as it doesn't have type information
    const rowData = row as any;

    return {
        ...rowData,
        embedding: bufferToEmbedding(rowData.embedding, rowData.dimension)
    };
}

/**
 * Finds similar notes based on vector similarity
 */
export async function findSimilarNotes(
    embedding: Float32Array,
    providerId: string,
    modelId: string,
    limit = 10,
    threshold?: number  // Made optional to use constants
): Promise<{noteId: string, similarity: number}[]> {
    // Import constants dynamically to avoid circular dependencies
    const { LLM_CONSTANTS } = await import('../../../routes/api/llm.js');
    // Use provided threshold or default from constants
    const similarityThreshold = threshold ?? LLM_CONSTANTS.SIMILARITY.DEFAULT_THRESHOLD;
    // Get all embeddings for the given provider and model
    const rows = await sql.getRows(`
        SELECT embedId, noteId, providerId, modelId, dimension, embedding
        FROM note_embeddings
        WHERE providerId = ? AND modelId = ?`,
        [providerId, modelId]
    );

    if (!rows.length) {
        return [];
    }

    // Calculate similarity for each embedding
    const similarities = rows.map(row => {
        const rowData = row as any;
        const rowEmbedding = bufferToEmbedding(rowData.embedding, rowData.dimension);
        return {
            noteId: rowData.noteId,
            similarity: cosineSimilarity(embedding, rowEmbedding)
        };
    });

    // Filter by threshold and sort by similarity (highest first)
    return similarities
        .filter(item => item.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
}

/**
 * Delete embeddings for a note
 *
 * @param noteId - The ID of the note
 * @param providerId - Optional provider ID to delete embeddings only for a specific provider
 * @param modelId - Optional model ID to delete embeddings only for a specific model
 */
export async function deleteNoteEmbeddings(noteId: string, providerId?: string, modelId?: string) {
    let query = "DELETE FROM note_embeddings WHERE noteId = ?";
    const params: any[] = [noteId];

    if (providerId) {
        query += " AND providerId = ?";
        params.push(providerId);

        if (modelId) {
            query += " AND modelId = ?";
            params.push(modelId);
        }
    }

    await sql.execute(query, params);
}
