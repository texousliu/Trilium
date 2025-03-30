import type { ChatPipelineInput, ChatPipelineConfig, PipelineMetrics, StreamCallback } from './interfaces.js';
import type { ChatResponse, StreamChunk } from '../ai_interface.js';
import { ContextExtractionStage } from './stages/context_extraction_stage.js';
import { SemanticContextExtractionStage } from './stages/semantic_context_extraction_stage.js';
import { AgentToolsContextStage } from './stages/agent_tools_context_stage.js';
import { MessagePreparationStage } from './stages/message_preparation_stage.js';
import { ModelSelectionStage } from './stages/model_selection_stage.js';
import { LLMCompletionStage } from './stages/llm_completion_stage.js';
import { ResponseProcessingStage } from './stages/response_processing_stage.js';
import log from '../../log.js';

/**
 * Pipeline for managing the entire chat flow
 * Implements a modular, composable architecture where each stage is a separate component
 */
export class ChatPipeline {
    stages: {
        contextExtraction: ContextExtractionStage;
        semanticContextExtraction: SemanticContextExtractionStage;
        agentToolsContext: AgentToolsContextStage;
        messagePreparation: MessagePreparationStage;
        modelSelection: ModelSelectionStage;
        llmCompletion: LLMCompletionStage;
        responseProcessing: ResponseProcessingStage;
    };

    config: ChatPipelineConfig;
    metrics: PipelineMetrics;

    /**
     * Create a new chat pipeline
     * @param config Optional pipeline configuration
     */
    constructor(config?: Partial<ChatPipelineConfig>) {
        // Initialize all pipeline stages
        this.stages = {
            contextExtraction: new ContextExtractionStage(),
            semanticContextExtraction: new SemanticContextExtractionStage(),
            agentToolsContext: new AgentToolsContextStage(),
            messagePreparation: new MessagePreparationStage(),
            modelSelection: new ModelSelectionStage(),
            llmCompletion: new LLMCompletionStage(),
            responseProcessing: new ResponseProcessingStage()
        };

        // Set default configuration values
        this.config = {
            enableStreaming: true,
            enableMetrics: true,
            maxToolCallIterations: 5,
            ...config
        };

        // Initialize metrics
        this.metrics = {
            totalExecutions: 0,
            averageExecutionTime: 0,
            stageMetrics: {}
        };

        // Initialize stage metrics
        Object.keys(this.stages).forEach(stageName => {
            this.metrics.stageMetrics[stageName] = {
                totalExecutions: 0,
                averageExecutionTime: 0
            };
        });
    }

    /**
     * Execute the chat pipeline
     * This is the main entry point that orchestrates all pipeline stages
     */
    async execute(input: ChatPipelineInput): Promise<ChatResponse> {
        log.info(`Executing chat pipeline with ${input.messages.length} messages`);
        const startTime = Date.now();
        this.metrics.totalExecutions++;

        // Initialize streaming handler if requested
        let streamCallback = input.streamCallback;
        let accumulatedText = '';

        try {
            // Extract content length for model selection
            let contentLength = 0;
            for (const message of input.messages) {
                contentLength += message.content.length;
            }

            // Determine which pipeline flow to use
            let context: string | undefined;

            // For context-aware chats, get the appropriate context
            if (input.noteId && input.query) {
                const contextStartTime = Date.now();
                if (input.showThinking) {
                    // Get enhanced context with agent tools if thinking is enabled
                    const agentContext = await this.stages.agentToolsContext.execute({
                        noteId: input.noteId,
                        query: input.query,
                        showThinking: input.showThinking
                    });
                    context = agentContext.context;
                    this.updateStageMetrics('agentToolsContext', contextStartTime);
                } else {
                    // Get semantic context for regular queries
                    const semanticContext = await this.stages.semanticContextExtraction.execute({
                        noteId: input.noteId,
                        query: input.query,
                        messages: input.messages
                    });
                    context = semanticContext.context;
                    this.updateStageMetrics('semanticContextExtraction', contextStartTime);
                }
            }

            // Select the appropriate model based on query complexity and content length
            const modelSelectionStartTime = Date.now();
            const modelSelection = await this.stages.modelSelection.execute({
                options: input.options,
                query: input.query,
                contentLength
            });
            this.updateStageMetrics('modelSelection', modelSelectionStartTime);

            // Prepare messages with context and system prompt
            const messagePreparationStartTime = Date.now();
            const preparedMessages = await this.stages.messagePreparation.execute({
                messages: input.messages,
                context,
                systemPrompt: input.options?.systemPrompt,
                options: modelSelection.options
            });
            this.updateStageMetrics('messagePreparation', messagePreparationStartTime);

            // Generate completion using the LLM
            const llmStartTime = Date.now();

            // Setup streaming handler if streaming is enabled and callback provided
            const enableStreaming = this.config.enableStreaming &&
                                  modelSelection.options.stream !== false &&
                                  typeof streamCallback === 'function';

            if (enableStreaming) {
                // Make sure stream is enabled in options
                modelSelection.options.stream = true;
            }

            const completion = await this.stages.llmCompletion.execute({
                messages: preparedMessages.messages,
                options: modelSelection.options
            });
            this.updateStageMetrics('llmCompletion', llmStartTime);

            // Handle streaming if enabled and available
            if (enableStreaming && completion.response.stream && streamCallback) {
                // Setup stream handler that passes chunks through response processing
                await completion.response.stream(async (chunk: StreamChunk) => {
                    // Process the chunk text
                    const processedChunk = await this.processStreamChunk(chunk, input.options);

                    // Accumulate text for final response
                    accumulatedText += processedChunk.text;

                    // Forward to callback
                    await streamCallback!(processedChunk.text, processedChunk.done);
                });
            }

            // For non-streaming responses, process the full response
            const processStartTime = Date.now();
            const processed = await this.stages.responseProcessing.execute({
                response: completion.response,
                options: input.options
            });
            this.updateStageMetrics('responseProcessing', processStartTime);

            // Combine response with processed text, using accumulated text if streamed
            const finalResponse: ChatResponse = {
                ...completion.response,
                text: accumulatedText || processed.text
            };

            const endTime = Date.now();
            const executionTime = endTime - startTime;

            // Update overall average execution time
            this.metrics.averageExecutionTime =
                (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + executionTime) /
                this.metrics.totalExecutions;

            log.info(`Chat pipeline completed in ${executionTime}ms`);

            return finalResponse;
        } catch (error: any) {
            log.error(`Error in chat pipeline: ${error.message}`);
            throw error;
        }
    }

    /**
     * Process a stream chunk through the response processing stage
     */
    private async processStreamChunk(chunk: StreamChunk, options?: any): Promise<StreamChunk> {
        try {
            // Only process non-empty chunks
            if (!chunk.text) return chunk;

            // Create a minimal response object for the processor
            const miniResponse = {
                text: chunk.text,
                model: 'streaming',
                provider: 'streaming'
            };

            // Process the chunk text
            const processed = await this.stages.responseProcessing.execute({
                response: miniResponse,
                options: options
            });

            // Return processed chunk
            return {
                ...chunk,
                text: processed.text
            };
        } catch (error) {
            // On error, return original chunk
            log.error(`Error processing stream chunk: ${error}`);
            return chunk;
        }
    }

    /**
     * Update metrics for a pipeline stage
     */
    private updateStageMetrics(stageName: string, startTime: number) {
        if (!this.config.enableMetrics) return;

        const executionTime = Date.now() - startTime;
        const metrics = this.metrics.stageMetrics[stageName];

        metrics.totalExecutions++;
        metrics.averageExecutionTime =
            (metrics.averageExecutionTime * (metrics.totalExecutions - 1) + executionTime) /
            metrics.totalExecutions;
    }

    /**
     * Get the current pipeline metrics
     */
    getMetrics(): PipelineMetrics {
        return this.metrics;
    }

    /**
     * Reset pipeline metrics
     */
    resetMetrics(): void {
        this.metrics.totalExecutions = 0;
        this.metrics.averageExecutionTime = 0;

        Object.keys(this.metrics.stageMetrics).forEach(stageName => {
            this.metrics.stageMetrics[stageName] = {
                totalExecutions: 0,
                averageExecutionTime: 0
            };
        });
    }
}
