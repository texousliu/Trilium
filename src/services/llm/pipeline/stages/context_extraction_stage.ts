import { BasePipelineStage } from '../pipeline_stage.js';
import type { ContextExtractionInput } from '../interfaces.js';
import aiServiceManager from '../../ai_service_manager.js';
import log from '../../../log.js';

/**
 * Pipeline stage for extracting context from notes
 */
export class ContextExtractionStage extends BasePipelineStage<ContextExtractionInput, { context: string }> {
    constructor() {
        super('ContextExtraction');
    }

    /**
     * Extract context from a note
     */
    protected async process(input: ContextExtractionInput): Promise<{ context: string }> {
        const { noteId, query, useSmartContext = true } = input;
        log.info(`Extracting context from note ${noteId}, query: ${query?.substring(0, 50)}...`);

        let context: string;

        if (useSmartContext && query) {
            // Use smart context that considers the query for better relevance
            context = await aiServiceManager.getContextService().getSmartContext(noteId, query);
        } else {
            // Fall back to full context if smart context is disabled or no query available
            context = await aiServiceManager.getContextExtractor().getFullContext(noteId);
        }

        return { context };
    }
}
