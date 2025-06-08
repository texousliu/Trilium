import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatPipeline } from './chat_pipeline.js';
import type { ChatPipelineInput, ChatPipelineConfig } from './interfaces.js';
import type { Message, ChatResponse } from '../ai_interface.js';

// Mock all pipeline stages
vi.mock('./stages/context_extraction_stage.js', () => ({
    ContextExtractionStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({})
    }))
}));

vi.mock('./stages/semantic_context_extraction_stage.js', () => ({
    SemanticContextExtractionStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({})
    }))
}));

vi.mock('./stages/agent_tools_context_stage.js', () => ({
    AgentToolsContextStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({})
    }))
}));

vi.mock('./stages/message_preparation_stage.js', () => ({
    MessagePreparationStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({
            preparedMessages: [{ role: 'user', content: 'Hello' }]
        })
    }))
}));

vi.mock('./stages/model_selection_stage.js', () => ({
    ModelSelectionStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({
            selectedProvider: 'openai',
            selectedModel: 'gpt-4'
        })
    }))
}));

vi.mock('./stages/llm_completion_stage.js', () => ({
    LLMCompletionStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({
            response: {
                content: 'Hello! How can I help you?',
                role: 'assistant',
                finish_reason: 'stop'
            }
        })
    }))
}));

vi.mock('./stages/response_processing_stage.js', () => ({
    ResponseProcessingStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({
            processedResponse: {
                content: 'Hello! How can I help you?',
                role: 'assistant',
                finish_reason: 'stop'
            }
        })
    }))
}));

vi.mock('./stages/tool_calling_stage.js', () => ({
    ToolCallingStage: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({
            toolCallRequired: false
        })
    }))
}));

vi.mock('../tools/tool_registry.js', () => ({
    default: {
        getTools: vi.fn().mockReturnValue([]),
        executeTool: vi.fn()
    }
}));

vi.mock('../tools/tool_initializer.js', () => ({
    default: {
        initializeTools: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('ChatPipeline', () => {
    let pipeline: ChatPipeline;

    beforeEach(() => {
        vi.clearAllMocks();
        pipeline = new ChatPipeline();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(pipeline.config).toEqual({
                enableStreaming: true,
                enableMetrics: true,
                maxToolCallIterations: 3
            });
        });

        it('should accept custom configuration', () => {
            const customConfig: Partial<ChatPipelineConfig> = {
                enableStreaming: false,
                maxToolCallIterations: 5
            };
            
            const customPipeline = new ChatPipeline(customConfig);
            
            expect(customPipeline.config).toEqual({
                enableStreaming: false,
                enableMetrics: true,
                maxToolCallIterations: 5
            });
        });

        it('should initialize all pipeline stages', () => {
            expect(pipeline.stages.contextExtraction).toBeDefined();
            expect(pipeline.stages.semanticContextExtraction).toBeDefined();
            expect(pipeline.stages.agentToolsContext).toBeDefined();
            expect(pipeline.stages.messagePreparation).toBeDefined();
            expect(pipeline.stages.modelSelection).toBeDefined();
            expect(pipeline.stages.llmCompletion).toBeDefined();
            expect(pipeline.stages.responseProcessing).toBeDefined();
            expect(pipeline.stages.toolCalling).toBeDefined();
        });

        it('should initialize metrics', () => {
            expect(pipeline.metrics).toEqual({
                totalExecutions: 0,
                averageExecutionTime: 0,
                stageMetrics: {
                    contextExtraction: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    semanticContextExtraction: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    agentToolsContext: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    messagePreparation: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    modelSelection: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    llmCompletion: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    responseProcessing: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    },
                    toolCalling: {
                        totalExecutions: 0,
                        averageExecutionTime: 0
                    }
                }
            });
        });
    });

    describe('execute', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello' }
        ];

        const input: ChatPipelineInput = {
            messages,
            options: {},
            noteId: 'note-123'
        };

        it('should execute all pipeline stages in order', async () => {
            const result = await pipeline.execute(input);
            
            expect(pipeline.stages.contextExtraction.execute).toHaveBeenCalled();
            expect(pipeline.stages.semanticContextExtraction.execute).toHaveBeenCalled();
            expect(pipeline.stages.agentToolsContext.execute).toHaveBeenCalled();
            expect(pipeline.stages.messagePreparation.execute).toHaveBeenCalled();
            expect(pipeline.stages.modelSelection.execute).toHaveBeenCalled();
            expect(pipeline.stages.llmCompletion.execute).toHaveBeenCalled();
            expect(pipeline.stages.responseProcessing.execute).toHaveBeenCalled();
            expect(pipeline.stages.toolCalling.execute).toHaveBeenCalled();
            
            expect(result).toEqual({
                content: 'Hello! How can I help you?',
                role: 'assistant',
                finish_reason: 'stop'
            });
        });

        it('should increment total executions metric', async () => {
            const initialExecutions = pipeline.metrics.totalExecutions;
            
            await pipeline.execute(input);
            
            expect(pipeline.metrics.totalExecutions).toBe(initialExecutions + 1);
        });

        it('should handle streaming callback', async () => {
            const streamCallback = vi.fn();
            const inputWithStream = { ...input, streamCallback };
            
            await pipeline.execute(inputWithStream);
            
            expect(pipeline.stages.llmCompletion.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    streamCallback: expect.any(Function)
                })
            );
        });

        it('should handle tool calling iterations', async () => {
            // Mock tool calling stage to require a tool call
            const mockToolCallingStage = pipeline.stages.toolCalling;
            vi.mocked(mockToolCallingStage.execute)
                .mockResolvedValueOnce({
                    response: { text: 'Using tool...', model: 'test', provider: 'test' },
                    needsFollowUp: true,
                    messages: [{ role: 'assistant', content: 'Using tool...' }]
                })
                .mockResolvedValueOnce({
                    response: { text: 'Done', model: 'test', provider: 'test' },
                    needsFollowUp: false,
                    messages: []
                });
            
            await pipeline.execute(input);
            
            // Should call tool calling stage twice (initial + one iteration)
            expect(mockToolCallingStage.execute).toHaveBeenCalledTimes(2);
        });

        it('should respect max tool call iterations', async () => {
            // Set low max iterations
            pipeline.config.maxToolCallIterations = 1;
            
            // Mock tool calling stage to always require tool calls
            const mockToolCallingStage = pipeline.stages.toolCalling;
            vi.mocked(mockToolCallingStage.execute).mockResolvedValue({
                response: { text: 'Using tool...', model: 'test', provider: 'test' },
                needsFollowUp: true,
                messages: [{ role: 'assistant', content: 'Using tool...' }]
            });
            
            await pipeline.execute(input);
            
            // Should call tool calling stage max iterations + 1 (initial)
            expect(mockToolCallingStage.execute).toHaveBeenCalledTimes(2);
        });

        it('should handle stage errors gracefully', async () => {
            // Mock a stage to throw an error
            vi.mocked(pipeline.stages.contextExtraction.execute).mockRejectedValueOnce(
                new Error('Context extraction failed')
            );
            
            await expect(pipeline.execute(input)).rejects.toThrow(
                'Context extraction failed'
            );
        });

        it('should pass context between stages', async () => {
            const contextData = { context: 'Note context', noteId: 'note-123', query: 'test query' };
            vi.mocked(pipeline.stages.contextExtraction.execute).mockResolvedValueOnce(contextData);
            
            await pipeline.execute(input);
            
            expect(pipeline.stages.semanticContextExtraction.execute).toHaveBeenCalledWith(
                expect.objectContaining(contextData)
            );
        });

        it('should handle empty messages', async () => {
            const emptyInput: ChatPipelineInput = {
                messages: [],
                options: {},
                noteId: 'note-123'
            };
            
            const result = await pipeline.execute(emptyInput);
            
            expect(result).toEqual({
                content: 'Hello! How can I help you?',
                role: 'assistant',
                finish_reason: 'stop'
            });
        });

        it('should calculate content length for model selection', async () => {
            const longMessages: Message[] = [
                { role: 'user', content: 'This is a very long message that contains lots of text' },
                { role: 'assistant', content: 'This is another long response with detailed information' }
            ];
            
            const longInput = { ...input, messages: longMessages };
            
            await pipeline.execute(longInput);
            
            expect(pipeline.stages.modelSelection.execute).toHaveBeenCalledWith(
                expect.objectContaining({
                    contentLength: expect.any(Number)
                })
            );
        });

        it('should update average execution time', async () => {
            // Execute pipeline multiple times
            await pipeline.execute(input);
            await pipeline.execute(input);
            
            expect(pipeline.metrics.averageExecutionTime).toBeGreaterThan(0);
        });

        it('should disable streaming when config is false', async () => {
            pipeline.config.enableStreaming = false;
            const streamCallback = vi.fn();
            const inputWithStream = { ...input, streamCallback };
            
            await pipeline.execute(inputWithStream);
            
            // Should not pass stream callback to LLM stage
            expect(pipeline.stages.llmCompletion.execute).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    streamCallback: expect.any(Function)
                })
            );
        });

        it('should handle concurrent executions', async () => {
            const promises = [
                pipeline.execute(input),
                pipeline.execute(input),
                pipeline.execute(input)
            ];
            
            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(3);
            expect(pipeline.metrics.totalExecutions).toBe(3);
        });
    });

    describe('metrics', () => {
        it('should track stage execution times when metrics enabled', async () => {
            pipeline.config.enableMetrics = true;
            
            const input: ChatPipelineInput = {
                messages: [{ role: 'user', content: 'Hello' }],
                options: {},
                noteId: 'note-123'
            };
            
            await pipeline.execute(input);
            
            // Check that metrics were updated
            expect(pipeline.metrics.totalExecutions).toBe(1);
            expect(pipeline.metrics.averageExecutionTime).toBeGreaterThan(0);
        });

        it('should skip metrics when disabled', async () => {
            pipeline.config.enableMetrics = false;
            
            const input: ChatPipelineInput = {
                messages: [{ role: 'user', content: 'Hello' }],
                options: {},
                noteId: 'note-123'
            };
            
            await pipeline.execute(input);
            
            // Execution count should still be tracked
            expect(pipeline.metrics.totalExecutions).toBe(1);
        });
    });

    describe('error handling', () => {
        it('should propagate errors from stages', async () => {
            const error = new Error('Stage execution failed');
            vi.mocked(pipeline.stages.messagePreparation.execute).mockRejectedValueOnce(error);
            
            const input: ChatPipelineInput = {
                messages: [{ role: 'user', content: 'Hello' }],
                options: {},
                noteId: 'note-123'
            };
            
            await expect(pipeline.execute(input)).rejects.toThrow('Stage execution failed');
        });

        it('should handle invalid input gracefully', async () => {
            const invalidInput = {
                messages: null,
                noteId: 'note-123',
                userId: 'user-456'
            } as any;
            
            await expect(pipeline.execute(invalidInput)).rejects.toThrow();
        });
    });
});