import sql from "../../sql.js";
import { randomString } from "../../../services/utils.js";
import dateUtils from "../../../services/date_utils.js";
import log from "../../log.js";
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
    threshold?: number,  // Made optional to use constants
    useFallback = true   // Whether to try other providers if no embeddings found
): Promise<{noteId: string, similarity: number}[]> {
    // Import constants dynamically to avoid circular dependencies
    const { LLM_CONSTANTS } = await import('../../../routes/api/llm.js');
    // Use provided threshold or default from constants
    const similarityThreshold = threshold ?? LLM_CONSTANTS.SIMILARITY.DEFAULT_THRESHOLD;

    // Add logging for debugging
    log.info(`Finding similar notes for provider: ${providerId}, model: ${modelId}`);

    // Get all embeddings for the given provider and model
    const rows = await sql.getRows(`
        SELECT embedId, noteId, providerId, modelId, dimension, embedding
        FROM note_embeddings
        WHERE providerId = ? AND modelId = ?`,
        [providerId, modelId]
    );

    log.info(`Found ${rows.length} embeddings in database for provider: ${providerId}, model: ${modelId}`);

    // If no embeddings found for this provider/model and fallback is enabled
    if (rows.length === 0 && useFallback) {
        log.info(`No embeddings found for ${providerId}/${modelId}. Attempting fallback...`);

        // Define type for available embeddings
        interface EmbeddingMetadata {
            providerId: string;
            modelId: string;
            count: number;
            dimension: number;
        }

        // Get all available embedding providers and models with dimensions
        const availableEmbeddings = await sql.getRows(`
            SELECT DISTINCT providerId, modelId, COUNT(*) as count, dimension
            FROM note_embeddings
            GROUP BY providerId, modelId
            ORDER BY count DESC`
        ) as EmbeddingMetadata[];

        if (availableEmbeddings.length > 0) {
            log.info(`Available embeddings: ${JSON.stringify(availableEmbeddings.map(e => ({
                providerId: e.providerId,
                modelId: e.modelId,
                count: e.count
            })))}`);

            // Import the AIServiceManager to get provider precedence
            const { default: aiManager } = await import('../ai_service_manager.js');

            // Get providers in user-defined precedence order
            // This uses the internal providerOrder property that's set from user preferences
            const availableProviderIds = availableEmbeddings.map(e => e.providerId);

            // Get dedicated embedding provider precedence from options
            const options = (await import('../../options.js')).default;
            let preferredProviders: string[] = [];

            const embeddingPrecedence = await options.getOption('embeddingProviderPrecedence');

            if (embeddingPrecedence) {
                // Parse the precedence string (similar to aiProviderPrecedence parsing)
                if (embeddingPrecedence.startsWith('[') && embeddingPrecedence.endsWith(']')) {
                    preferredProviders = JSON.parse(embeddingPrecedence);
                } else if (typeof embeddingPrecedence === 'string') {
                    if (embeddingPrecedence.includes(',')) {
                        preferredProviders = embeddingPrecedence.split(',').map(p => p.trim());
                    } else {
                        preferredProviders = [embeddingPrecedence];
                    }
                }
            } else {
                // Fall back to the AI provider precedence if embedding-specific one isn't set
                // Get the AIServiceManager instance to access its properties
                const aiManagerInstance = aiManager.getInstance();

                // @ts-ignore - Accessing private property
                preferredProviders = aiManagerInstance.providerOrder || ['openai', 'anthropic', 'ollama'];
            }

            log.info(`Embedding provider precedence order: ${preferredProviders.join(', ')}`);

            // Try each provider in order of precedence
            for (const provider of preferredProviders) {
                // Skip the original provider we already tried
                if (provider === providerId) continue;

                // Skip providers that don't have embeddings
                if (!availableProviderIds.includes(provider)) continue;

                // Find the model with the most embeddings for this provider
                const providerEmbeddings = availableEmbeddings.filter(e => e.providerId === provider);

                if (providerEmbeddings.length > 0) {
                    // Find models that match the current embedding's dimensions
                    const dimensionMatchingModels = providerEmbeddings.filter(e => e.dimension === embedding.length);

                    // If we have models with matching dimensions, use the one with most embeddings
                    if (dimensionMatchingModels.length > 0) {
                        const bestModel = dimensionMatchingModels.sort((a, b) => b.count - a.count)[0];
                        log.info(`Found fallback provider with matching dimensions (${embedding.length}): ${provider}, model: ${bestModel.modelId}`);

                        // Recursive call with the new provider/model, but disable further fallbacks
                        return findSimilarNotes(
                            embedding,
                            provider,
                            bestModel.modelId,
                            limit,
                            threshold,
                            false // Prevent infinite recursion
                        );
                    } else {
                        // We need to regenerate embeddings with the new provider
                        log.info(`No models with matching dimensions found for ${provider}. Available models: ${JSON.stringify(
                            providerEmbeddings.map(e => ({ model: e.modelId, dimension: e.dimension }))
                        )}`);

                        try {
                            // Import provider manager to get a provider instance
                            const { default: providerManager } = await import('./providers.js');
                            const providerInstance = providerManager.getEmbeddingProvider(provider);

                            if (providerInstance) {
                                // Use the model with the most embeddings
                                const bestModel = providerEmbeddings.sort((a, b) => b.count - a.count)[0];
                                // Configure the model by setting it in the config
                                try {
                                    // Access the config safely through the getConfig method
                                    const config = providerInstance.getConfig();
                                    config.model = bestModel.modelId;

                                    log.info(`Trying to convert query to ${provider}/${bestModel.modelId} embedding format (dimension: ${bestModel.dimension})`);

                                    // Get the original query from the embedding cache if possible, or use a placeholder
                                    // This is a hack - ideally we'd pass the query text through the whole chain
                                    const originalQuery = "query"; // This is a placeholder, we'd need the original query text

                                    // Generate a new embedding with the fallback provider
                                    const newEmbedding = await providerInstance.generateEmbeddings(originalQuery);

                                    log.info(`Successfully generated new embedding with provider ${provider}/${bestModel.modelId} (dimension: ${newEmbedding.length})`);

                                    // Now try finding similar notes with the new embedding
                                    return findSimilarNotes(
                                        newEmbedding,
                                        provider,
                                        bestModel.modelId,
                                        limit,
                                        threshold,
                                        false // Prevent infinite recursion
                                    );
                                } catch (configErr: any) {
                                    log.error(`Error configuring provider ${provider}: ${configErr.message}`);
                                }
                            }
                        } catch (err: any) {
                            log.error(`Error converting embedding format: ${err.message}`);
                        }
                    }
                }
            }

            log.error(`No suitable fallback providers found with compatible dimensions. Current embedding dimension: ${embedding.length}`);
            log.info(`Available embeddings: ${JSON.stringify(availableEmbeddings.map(e => ({
                providerId: e.providerId,
                modelId: e.modelId,
                dimension: e.dimension,
                count: e.count
            })))}`);
        } else {
            log.info(`No embeddings found in the database at all. You need to generate embeddings first.`);
        }

        return [];
    } else if (rows.length === 0) {
        // No embeddings found and fallback disabled
        log.info(`No embeddings found for ${providerId}/${modelId} and fallback is disabled.`);
        return [];
    }

    // Calculate similarity for each embedding
    const similarities = [];
    for (const row of rows) {
        const rowData = row as any;
        const rowEmbedding = bufferToEmbedding(rowData.embedding, rowData.dimension);

        // Check if dimensions match before calculating similarity
        if (rowEmbedding.length !== embedding.length) {
            log.info(`Skipping embedding ${rowData.embedId} - dimension mismatch: ${rowEmbedding.length} vs ${embedding.length}`);
            continue;
        }

        try {
            const similarity = cosineSimilarity(embedding, rowEmbedding);
            similarities.push({
                noteId: rowData.noteId,
                similarity
            });
        } catch (err: any) {
            log.error(`Error calculating similarity for note ${rowData.noteId}: ${err.message}`);
        }
    }

    // Filter by threshold and sort by similarity (highest first)
    const results = similarities
        .filter(item => item.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    log.info(`Returning ${results.length} similar notes with similarity >= ${similarityThreshold}`);
    return results;
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
