import eventService from "../../../services/events.js";
import options from "../../../services/options.js";
import log from "../../../services/log.js";
import { queueNoteForEmbedding, processEmbeddingQueue } from "./queue.js";

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
    const interval = parseInt(await options.getOption('embeddingUpdateInterval') || '5000', 10);

    setInterval(async () => {
        try {
            await processEmbeddingQueue();
        } catch (error: any) {
            log.error(`Error in background embedding processing: ${error.message || 'Unknown error'}`);
        }
    }, interval);
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
