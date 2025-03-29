import { BasePipelineStage } from '../pipeline_stage.js';
import type { PipelineInput } from '../interfaces.js';
import aiServiceManager from '../../ai_service_manager.js';
import log from '../../../log.js';

interface AgentToolsContextInput extends PipelineInput {
    noteId: string;
    query: string;
    showThinking?: boolean;
}

/**
 * Pipeline stage for retrieving agent tools context
 */
export class AgentToolsContextStage extends BasePipelineStage<AgentToolsContextInput, { context: string }> {
    constructor() {
        super('AgentToolsContext');
    }

    /**
     * Get enhanced context with agent tools
     */
    protected async process(input: AgentToolsContextInput): Promise<{ context: string }> {
        const { noteId, query, showThinking = false } = input;
        log.info(`Getting agent tools context for note ${noteId}, query: ${query?.substring(0, 50)}..., showThinking: ${showThinking}`);

        const contextService = aiServiceManager.getContextService();
        const context = await contextService.getAgentToolsContext(noteId, query, showThinking);

        return { context };
    }
}
