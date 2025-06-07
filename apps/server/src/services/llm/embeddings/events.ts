import sql from "../../../services/sql.js";
import log from "../../../services/log.js";
import options from "../../../services/options.js";
import cls from "../../../services/cls.js";
import { processEmbeddingQueue, queueNoteForEmbedding } from "./queue.js";
import eventService from "../../../services/events.js";
import becca from "../../../becca/becca.js";

// Add mutex to prevent concurrent processing
let isProcessingEmbeddings = false;

// Store interval reference for cleanup
let backgroundProcessingInterval: NodeJS.Timeout | null = null;

/**
 * Setup event listeners for embedding-related events
 */
export function setupEmbeddingEventListeners() {
    // Listen for note content changes
    eventService.subscribe(eventService.NOTE_CONTENT_CHANGE, ({ entity }) => {
        if (entity && entity.noteId) {
            queueNoteForEmbedding(entity.noteId);
        }
    });

    // Listen for new notes
    eventService.subscribe(eventService.ENTITY_CREATED, ({ entityName, entity }) => {
        if (entityName === "notes" && entity && entity.noteId) {
            queueNoteForEmbedding(entity.noteId);
        }
    });

    // Listen for note title changes
    eventService.subscribe(eventService.NOTE_TITLE_CHANGED, ({ noteId }) => {
        if (noteId) {
            queueNoteForEmbedding(noteId);
        }
    });

    // Listen for note deletions
    eventService.subscribe(eventService.ENTITY_DELETED, ({ entityName, entityId }) => {
        if (entityName === "notes" && entityId) {
            queueNoteForEmbedding(entityId, 'DELETE');
        }
    });

    // Listen for attribute changes that might affect context
    eventService.subscribe(eventService.ENTITY_CHANGED, ({ entityName, entity }) => {
        if (entityName === "attributes" && entity && entity.noteId) {
            queueNoteForEmbedding(entity.noteId);
        }
    });
}

/**
 * Setup background processing of the embedding queue
 */
export async function setupEmbeddingBackgroundProcessing() {
    // Clear any existing interval
    if (backgroundProcessingInterval) {
        clearInterval(backgroundProcessingInterval);
        backgroundProcessingInterval = null;
    }

    const interval = parseInt(await options.getOption('embeddingUpdateInterval') || '200', 10);

    backgroundProcessingInterval = setInterval(async () => {
        try {
            // Skip if already processing
            if (isProcessingEmbeddings) {
                return;
            }

            // Set mutex
            isProcessingEmbeddings = true;

            // Wrap in cls.init to ensure proper context
            cls.init(async () => {
                await processEmbeddingQueue();
            });
        } catch (error: any) {
            log.error(`Error in background embedding processing: ${error.message || 'Unknown error'}`);
        } finally {
            // Always release the mutex
            isProcessingEmbeddings = false;
        }
    }, interval);
}

/**
 * Stop background processing of the embedding queue
 */
export function stopEmbeddingBackgroundProcessing() {
    if (backgroundProcessingInterval) {
        clearInterval(backgroundProcessingInterval);
        backgroundProcessingInterval = null;
        log.info("Embedding background processing stopped");
    }
}

/**
 * Initialize embeddings system
 */
export async function initEmbeddings() {
    if (await options.getOptionBool('aiEnabled')) {
        setupEmbeddingEventListeners();
        await setupEmbeddingBackgroundProcessing();
        log.info("Embeddings system initialized");
    } else {
        log.info("Embeddings system disabled");
    }
}
