import options from '../options.js';
import { BaseAIService } from './base_ai_service.js';
import type { ChatCompletionOptions, ChatResponse, Message } from './ai_interface.js';

export class OllamaService extends BaseAIService {
    constructor() {
        super('Ollama');
    }

    isAvailable(): boolean {
        return super.isAvailable() &&
               options.getOption('ollamaEnabled') === 'true' &&
               !!options.getOption('ollamaBaseUrl');
    }

    async generateChatCompletion(messages: Message[], opts: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!this.isAvailable()) {
            throw new Error('Ollama service is not available. Check Ollama settings.');
        }

        const baseUrl = options.getOption('ollamaBaseUrl') || 'http://localhost:11434';
        const model = opts.model || options.getOption('ollamaDefaultModel') || 'llama2';
        const temperature = opts.temperature !== undefined
            ? opts.temperature
            : parseFloat(options.getOption('aiTemperature') || '0.7');

        const systemPrompt = this.getSystemPrompt(opts.systemPrompt || options.getOption('aiSystemPrompt'));

        // Format messages for Ollama
        const formattedMessages = this.formatMessages(messages, systemPrompt);

        try {
            const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/chat`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages: formattedMessages,
                    options: {
                        temperature,
                    }
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();

            return {
                text: data.message?.content || "No response from Ollama",
                model: data.model || model,
                provider: this.getName(),
                usage: {
                    // Ollama doesn't provide token usage in the same format
                    totalTokens: data.eval_count || data.prompt_eval_count || 0
                }
            };
        } catch (error) {
            console.error('Ollama service error:', error);
            throw error;
        }
    }

    private formatMessages(messages: Message[], systemPrompt: string): any[] {
        // Add system message if it doesn't exist
        const hasSystemMessage = messages.some(m => m.role === 'system');
        let resultMessages = [...messages];

        if (!hasSystemMessage && systemPrompt) {
            resultMessages.unshift({
                role: 'system',
                content: systemPrompt
            });
        }

        // Ollama uses the same format as OpenAI for messages
        return resultMessages;
    }
}
