import type { ToolCall } from './tools/tool_interfaces.js';
import type { ModelMetadata } from './providers/provider_options.js';

export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    name?: string;
    tool_call_id?: string;
    tool_calls?: ToolCall[] | any[];
}

// Interface for streaming response chunks
export interface StreamChunk {
    text: string;
    done: boolean;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
}

/**
 * Options for chat completion requests
 * 
 * Key properties:
 * - stream: If true, the response will be streamed
 * - model: Model name to use
 * - provider: Provider to use (openai, anthropic, ollama, etc.)
 * - enableTools: If true, enables tool support
 * 
 * The stream option is particularly important and should be consistently handled
 * throughout the pipeline. It should be explicitly set to true or false.
 */
export interface ChatCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    showThinking?: boolean;
    systemPrompt?: string;
    preserveSystemPrompt?: boolean; // Whether to preserve existing system message
    bypassFormatter?: boolean; // Whether to bypass the message formatter entirely
    expectsJsonResponse?: boolean; // Whether this request expects a JSON response
    stream?: boolean; // Whether to stream the response
    enableTools?: boolean; // Whether to enable tool calling
    tools?: any[]; // Tools to provide to the LLM
    useAdvancedContext?: boolean; // Whether to use advanced context enrichment
    toolExecutionStatus?: any[]; // Status information about executed tools for feedback
    providerMetadata?: ModelMetadata; // Metadata about the provider and model capabilities
}

export interface ChatResponse {
    text: string;
    model: string;
    provider: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    // Stream handler - only present when streaming is enabled
    stream?: (callback: (chunk: StreamChunk) => Promise<void> | void) => Promise<string>;
    // Tool calls from the LLM
    tool_calls?: ToolCall[] | any[];
}

export interface AIService {
    /**
     * Generate a chat completion response
     */
    generateChatCompletion(messages: Message[], options?: ChatCompletionOptions): Promise<ChatResponse>;

    /**
     * Check if the service can be used (API key is set, etc.)
     */
    isAvailable(): boolean;

    /**
     * Get the name of the service
     */
    getName(): string;
}

/**
 * Interface for the semantic context service, which provides enhanced context retrieval
 * for AI conversations based on semantic similarity.
 */
export interface SemanticContextService {
    /**
     * Initialize the semantic context service
     */
    initialize(): Promise<void>;

    /**
     * Retrieve semantic context based on relevance to user query
     */
    getSemanticContext(noteId: string, userQuery: string, maxResults?: number, messages?: Message[]): Promise<string>;

    /**
     * Get progressive context based on depth
     */
    getProgressiveContext?(noteId: string, depth?: number): Promise<string>;

    /**
     * Get smart context selection that adapts to query complexity
     */
    getSmartContext?(noteId: string, userQuery: string): Promise<string>;

    /**
     * Enhance LLM context with agent tools
     */
    getAgentToolsContext(noteId: string, query: string, showThinking?: boolean): Promise<string>;
}
