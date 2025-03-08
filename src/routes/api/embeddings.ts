import options from "../../services/options.js";
import vectorStore from "../../services/llm/embeddings/vector_store.js";
import providerManager from "../../services/llm/embeddings/providers.js";
import becca from "../../becca/becca.js";
import type { Request, Response } from "express";

/**
 * Get similar notes based on note ID
 */
async function findSimilarNotes(req: Request, res: Response) {
    const noteId = req.params.noteId;
    const providerId = req.query.providerId as string || 'openai';
    const modelId = req.query.modelId as string || 'text-embedding-3-small';
    const limit = parseInt(req.query.limit as string || '10', 10);
    const threshold = parseFloat(req.query.threshold as string || '0.7');

    if (!noteId) {
        return res.status(400).send({
            success: false,
            message: "Note ID is required"
        });
    }

    try {
        const embedding = await vectorStore.getEmbeddingForNote(noteId, providerId, modelId);

        if (!embedding) {
            // If no embedding exists for this note yet, generate one
            const note = becca.getNote(noteId);
            if (!note) {
                return res.status(404).send({
                    success: false,
                    message: "Note not found"
                });
            }

            const context = await vectorStore.getNoteEmbeddingContext(noteId);
            const provider = providerManager.getEmbeddingProvider(providerId);

            if (!provider) {
                return res.status(400).send({
                    success: false,
                    message: `Embedding provider '${providerId}' not found`
                });
            }

            const newEmbedding = await provider.generateNoteEmbeddings(context);
            await vectorStore.storeNoteEmbedding(noteId, providerId, modelId, newEmbedding);

            const similarNotes = await vectorStore.findSimilarNotes(
                newEmbedding, providerId, modelId, limit, threshold
            );

            return res.send({
                success: true,
                similarNotes
            });
        }

        const similarNotes = await vectorStore.findSimilarNotes(
            embedding.embedding, providerId, modelId, limit, threshold
        );

        return res.send({
            success: true,
            similarNotes
        });
    } catch (error: any) {
        return res.status(500).send({
            success: false,
            message: error.message || "Unknown error"
        });
    }
}

/**
 * Search notes by text
 */
async function searchByText(req: Request, res: Response) {
    const { text } = req.body;
    const providerId = req.query.providerId as string || 'openai';
    const modelId = req.query.modelId as string || 'text-embedding-3-small';
    const limit = parseInt(req.query.limit as string || '10', 10);
    const threshold = parseFloat(req.query.threshold as string || '0.7');

    if (!text) {
        return res.status(400).send({
            success: false,
            message: "Search text is required"
        });
    }

    try {
        const provider = providerManager.getEmbeddingProvider(providerId);

        if (!provider) {
            return res.status(400).send({
                success: false,
                message: `Embedding provider '${providerId}' not found`
            });
        }

        // Generate embedding for the search text
        const embedding = await provider.generateEmbeddings(text);

        // Find similar notes
        const similarNotes = await vectorStore.findSimilarNotes(
            embedding, providerId, modelId, limit, threshold
        );

        return res.send({
            success: true,
            similarNotes
        });
    } catch (error: any) {
        return res.status(500).send({
            success: false,
            message: error.message || "Unknown error"
        });
    }
}

/**
 * Get embedding providers
 */
async function getProviders(req: Request, res: Response) {
    try {
        const providerConfigs = await providerManager.getEmbeddingProviderConfigs();
        return res.send({
            success: true,
            providers: providerConfigs
        });
    } catch (error: any) {
        return res.status(500).send({
            success: false,
            message: error.message || "Unknown error"
        });
    }
}

/**
 * Update provider configuration
 */
async function updateProvider(req: Request, res: Response) {
    const { providerId } = req.params;
    const { isEnabled, priority, config } = req.body;

    try {
        const success = await providerManager.updateEmbeddingProviderConfig(
            providerId, isEnabled, priority, config
        );

        if (!success) {
            return res.status(404).send({
                success: false,
                message: "Provider not found"
            });
        }

        return res.send({
            success: true
        });
    } catch (error: any) {
        return res.status(500).send({
            success: false,
            message: error.message || "Unknown error"
        });
    }
}

/**
 * Manually trigger a reprocessing of all notes
 */
async function reprocessAllNotes(req: Request, res: Response) {
    try {
        await vectorStore.reprocessAllNotes();

        return res.send({
            success: true,
            message: "Notes queued for reprocessing"
        });
    } catch (error: any) {
        return res.status(500).send({
            success: false,
            message: error.message || "Unknown error"
        });
    }
}

/**
 * Get embedding queue status
 */
async function getQueueStatus(req: Request, res: Response) {
    try {
        // Use sql directly instead of becca.sqliteDB
        const sql = require("../../services/sql.js").default;

        const queueCount = await sql.getValue(
            "SELECT COUNT(*) FROM embedding_queue"
        );

        const failedCount = await sql.getValue(
            "SELECT COUNT(*) FROM embedding_queue WHERE attempts > 0"
        );

        const totalEmbeddingsCount = await sql.getValue(
            "SELECT COUNT(*) FROM note_embeddings"
        );

        return res.send({
            success: true,
            status: {
                queueCount,
                failedCount,
                totalEmbeddingsCount
            }
        });
    } catch (error: any) {
        return res.status(500).send({
            success: false,
            message: error.message || "Unknown error"
        });
    }
}

export default {
    findSimilarNotes,
    searchByText,
    getProviders,
    updateProvider,
    reprocessAllNotes,
    getQueueStatus
};
