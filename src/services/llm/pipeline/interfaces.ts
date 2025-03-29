import type { Message, ChatCompletionOptions, ChatResponse, StreamChunk } from '../ai_interface.js';

/**
 * Base interface for pipeline input
 */
export interface PipelineInput {
    [key: string]: any;
}

/**
 * Pipeline configuration options
 */
export interface ChatPipelineConfig {
    /**
     * Whether to enable streaming support
     */
    enableStreaming: boolean;
    
    /**
     * Whether to enable performance metrics
     */
    enableMetrics: boolean;
    
    /**
     * Maximum number of tool call iterations
     */
    maxToolCallIterations: number;
}

/**
 * Pipeline metrics for monitoring performance
 */
export interface PipelineMetrics {
    totalExecutions: number;
    averageExecutionTime: number;
    stageMetrics: Record<string, StageMetrics>;
}

/**
 * Metrics for an individual pipeline stage
 */
export interface StageMetrics {
    totalExecutions: number;
    averageExecutionTime: number;
}

/**
 * Callback for handling stream chunks
 */
export type StreamCallback = (text: string, isDone: boolean) => Promise<void> | void;

/**
 * Common input for all chat-related pipeline stages
 */
export interface ChatPipelineInput extends PipelineInput {
    messages: Message[];
    options?: ChatCompletionOptions;
    noteId?: string;
    query?: string;
    showThinking?: boolean;
    streamCallback?: StreamCallback;
}

/**
 * Base interface for pipeline stage output
 */
export interface PipelineOutput {
    [key: string]: any;
}

/**
 * Interface for the pipeline stage that performs context extraction
 */
export interface ContextExtractionInput extends PipelineInput {
    noteId: string;
    query: string;
    useSmartContext?: boolean;
}

/**
 * Interface for the pipeline stage that performs semantic context extraction
 */
export interface SemanticContextExtractionInput extends PipelineInput {
    noteId: string;
    query: string;
    maxResults?: number;
}

/**
 * Interface for the pipeline stage that performs message preparation
 */
export interface MessagePreparationInput extends PipelineInput {
    messages: Message[];
    context?: string;
    systemPrompt?: string;
    options?: ChatCompletionOptions;
}

/**
 * Interface for the pipeline stage that performs model selection
 */
export interface ModelSelectionInput extends PipelineInput {
    options?: ChatCompletionOptions;
    query?: string;
    contentLength?: number;
}

/**
 * Interface for the pipeline stage that performs LLM completion
 */
export interface LLMCompletionInput extends PipelineInput {
    messages: Message[];
    options?: ChatCompletionOptions;
    provider?: string;
}

/**
 * Interface for the pipeline stage that performs response processing
 */
export interface ResponseProcessingInput extends PipelineInput {
    response: ChatResponse;
    options?: ChatCompletionOptions;
}

/**
 * Interface for the pipeline stage that handles tool execution
 */
export interface ToolExecutionInput extends PipelineInput {
    response: ChatResponse;
    messages: Message[];
    options?: ChatCompletionOptions;
}

/**
 * Base interface for a pipeline stage
 */
export interface PipelineStage<TInput extends PipelineInput, TOutput extends PipelineOutput> {
    name: string;
    execute(input: TInput): Promise<TOutput>;
}
