export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatCompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
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
