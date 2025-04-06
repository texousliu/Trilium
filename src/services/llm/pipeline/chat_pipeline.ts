import type { ChatPipelineInput, ChatPipelineConfig, PipelineMetrics, StreamCallback } from './interfaces.js';
import type { ChatResponse, StreamChunk } from '../ai_interface.js';
import { ContextExtractionStage } from './stages/context_extraction_stage.js';
import { SemanticContextExtractionStage } from './stages/semantic_context_extraction_stage.js';
import { AgentToolsContextStage } from './stages/agent_tools_context_stage.js';
import { MessagePreparationStage } from './stages/message_preparation_stage.js';
import { ModelSelectionStage } from './stages/model_selection_stage.js';
import { LLMCompletionStage } from './stages/llm_completion_stage.js';
import { ResponseProcessingStage } from './stages/response_processing_stage.js';
import { ToolCallingStage } from './stages/tool_calling_stage.js';
import { VectorSearchStage } from './stages/vector_search_stage.js';
import toolRegistry from '../tools/tool_registry.js';
import toolInitializer from '../tools/tool_initializer.js';
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
        toolCalling: ToolCallingStage;
        vectorSearch: VectorSearchStage;
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
            responseProcessing: new ResponseProcessingStage(),
            toolCalling: new ToolCallingStage(),
            vectorSearch: new VectorSearchStage()
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

            // Initialize tools if needed
            try {
                const toolCount = toolRegistry.getAllTools().length;

                // If there are no tools registered, initialize them
                if (toolCount === 0) {
                    log.info('No tools found in registry, initializing tools...');
                    await toolInitializer.initializeTools();
                    log.info(`Tools initialized, now have ${toolRegistry.getAllTools().length} tools`);
                } else {
                    log.info(`Found ${toolCount} tools already registered`);
                }
            } catch (error: any) {
                log.error(`Error checking/initializing tools: ${error.message || String(error)}`);
            }

            // First, select the appropriate model based on query complexity and content length
            const modelSelectionStartTime = Date.now();
            const modelSelection = await this.stages.modelSelection.execute({
                options: input.options,
                query: input.query,
                contentLength
            });
            this.updateStageMetrics('modelSelection', modelSelectionStartTime);

            // Determine if we should use tools or semantic context
            const useTools = modelSelection.options.enableTools === true;

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
                } else if (!useTools) {
                    // Only get semantic context if tools are NOT enabled
                    // When tools are enabled, we'll let the LLM request context via tools instead
                    log.info('Getting semantic context for note using pipeline stages');
                    
                    // First use the vector search stage to find relevant notes
                    const vectorSearchStartTime = Date.now();
                    log.info(`Executing vector search stage for query: "${input.query?.substring(0, 50)}..."`);
                    
                    const vectorSearchResult = await this.stages.vectorSearch.execute({
                        query: input.query || '',
                        noteId: input.noteId,
                        options: {
                            maxResults: 10,
                            useEnhancedQueries: true,
                            threshold: 0.6
                        }
                    });
                    
                    this.updateStageMetrics('vectorSearch', vectorSearchStartTime);
                    
                    log.info(`Vector search found ${vectorSearchResult.searchResults.length} relevant notes`);
                    
                    // Then pass to the semantic context stage to build the formatted context
                    const semanticContext = await this.stages.semanticContextExtraction.execute({
                        noteId: input.noteId,
                        query: input.query,
                        messages: input.messages
                    });
                    
                    context = semanticContext.context;
                    this.updateStageMetrics('semanticContextExtraction', contextStartTime);
                } else {
                    log.info('Tools are enabled - using minimal direct context to avoid race conditions');
                    // Get context from current note directly without semantic search
                    if (input.noteId) {
                        try {
                            const contextExtractor = new (await import('../../llm/context/index.js')).ContextExtractor();
                            // Just get the direct content of the current note
                            context = await contextExtractor.extractContext(input.noteId, {
                                includeContent: true,
                                includeParents: true,
                                includeChildren: true,
                                includeLinks: true,
                                includeSimilar: false // Skip semantic search to avoid race conditions
                            });
                            log.info(`Direct context extracted (${context.length} chars) without semantic search`);
                        } catch (error: any) {
                            log.error(`Error extracting direct context: ${error.message}`);
                            context = ""; // Fallback to empty context if extraction fails
                        }
                    } else {
                        context = ""; // No note ID, so no context
                    }
                }
            }

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

            // Process any tool calls in the response
            let currentMessages = preparedMessages.messages;
            let currentResponse = completion.response;
            let needsFollowUp = false;
            let toolCallIterations = 0;
            const maxToolCallIterations = this.config.maxToolCallIterations;

            // Check if tools were enabled in the options
            const toolsEnabled = modelSelection.options.enableTools !== false;
            
            log.info(`========== TOOL CALL PROCESSING ==========`);
            log.info(`Tools enabled: ${toolsEnabled}`);
            log.info(`Tool calls in response: ${currentResponse.tool_calls ? currentResponse.tool_calls.length : 0}`);
            log.info(`Current response format: ${typeof currentResponse}`);
            log.info(`Response keys: ${Object.keys(currentResponse).join(', ')}`);
            
            // Detailed tool call inspection
            if (currentResponse.tool_calls) {
                currentResponse.tool_calls.forEach((tool, idx) => {
                    log.info(`Tool call ${idx+1}: ${JSON.stringify(tool)}`);
                });
            }

            // Process tool calls if present and tools are enabled
            if (toolsEnabled && currentResponse.tool_calls && currentResponse.tool_calls.length > 0) {
                log.info(`Response contains ${currentResponse.tool_calls.length} tool calls, processing...`);

                // Start tool calling loop
                log.info(`Starting tool calling loop with max ${maxToolCallIterations} iterations`);

                do {
                    log.info(`Tool calling iteration ${toolCallIterations + 1}`);

                    // Execute tool calling stage
                    const toolCallingStartTime = Date.now();
                    const toolCallingResult = await this.stages.toolCalling.execute({
                        response: currentResponse,
                        messages: currentMessages,
                        options: modelSelection.options
                    });
                    this.updateStageMetrics('toolCalling', toolCallingStartTime);

                    // Update state for next iteration
                    currentMessages = toolCallingResult.messages;
                    needsFollowUp = toolCallingResult.needsFollowUp;

                    // Make another call to the LLM if needed
                    if (needsFollowUp) {
                        log.info(`Tool execution completed, making follow-up LLM call (iteration ${toolCallIterations + 1})...`);

                        // Generate a new LLM response with the updated messages
                        const followUpStartTime = Date.now();
                        log.info(`Sending follow-up request to LLM with ${currentMessages.length} messages (including tool results)`);

                        const followUpCompletion = await this.stages.llmCompletion.execute({
                            messages: currentMessages,
                            options: modelSelection.options
                        });
                        this.updateStageMetrics('llmCompletion', followUpStartTime);

                        // Update current response for next iteration
                        currentResponse = followUpCompletion.response;

                        // Check for more tool calls
                        const hasMoreToolCalls = !!(currentResponse.tool_calls && currentResponse.tool_calls.length > 0);

                        if (hasMoreToolCalls) {
                            log.info(`Follow-up response contains ${currentResponse.tool_calls?.length || 0} more tool calls`);
                        } else {
                            log.info(`Follow-up response contains no more tool calls - completing tool loop`);
                        }

                        // Continue loop if there are more tool calls
                        needsFollowUp = hasMoreToolCalls;
                    }

                    // Increment iteration counter
                    toolCallIterations++;

                } while (needsFollowUp && toolCallIterations < maxToolCallIterations);

                // If we hit max iterations but still have tool calls, log a warning
                if (toolCallIterations >= maxToolCallIterations && needsFollowUp) {
                    log.error(`Reached maximum tool call iterations (${maxToolCallIterations}), stopping`);
                }

                log.info(`Completed ${toolCallIterations} tool call iterations`);
            }

            // For non-streaming responses, process the final response
            const processStartTime = Date.now();
            const processed = await this.stages.responseProcessing.execute({
                response: currentResponse,
                options: input.options
            });
            this.updateStageMetrics('responseProcessing', processStartTime);

            // Combine response with processed text, using accumulated text if streamed
            const finalResponse: ChatResponse = {
                ...currentResponse,
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
