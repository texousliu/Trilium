import { BasePipelineStage } from '../pipeline_stage.js';
import type { SemanticContextExtractionInput } from '../interfaces.js';
import aiServiceManager from '../../ai_service_manager.js';
import log from '../../../log.js';

/**
 * Pipeline stage for extracting semantic context from notes
 */
export class SemanticContextExtractionStage extends BasePipelineStage<SemanticContextExtractionInput, { context: string }> {
    constructor() {
        super('SemanticContextExtraction');
    }

    /**
     * Extract semantic context based on a query
     */
    protected async process(input: SemanticContextExtractionInput): Promise<{ context: string }> {
        const { noteId, query, maxResults = 5 } = input;
        log.info(`Extracting semantic context from note ${noteId}, query: ${query?.substring(0, 50)}...`);

        const contextService = aiServiceManager.getContextService();
        const context = await contextService.getSemanticContext(noteId, query, maxResults);

        return { context };
    }
}
