import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { Message, ChatCompletionOptions, ChatResponse } from '../ai_interface.js';
import sanitizeHtml from 'sanitize-html';
import { OllamaMessageFormatter } from '../formatters/ollama_formatter.js';

interface OllamaMessage {
    role: string;
    content: string;
}

interface OllamaResponse {
    model: string;
    created_at: string;
    message: OllamaMessage;
    done: boolean;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}

export class OllamaService extends BaseAIService {
    private formatter: OllamaMessageFormatter;

    constructor() {
        super('Ollama');
        this.formatter = new OllamaMessageFormatter();
    }

    isAvailable(): boolean {
        return super.isAvailable() && !!options.getOption('ollamaBaseUrl');
    }

    async generateChatCompletion(messages: Message[], opts: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!this.isAvailable()) {
            throw new Error('Ollama service is not available. Check API URL in settings.');
        }

        const apiBase = options.getOption('ollamaBaseUrl');
        const model = opts.model || options.getOption('ollamaDefaultModel') || 'llama3';
        const temperature = opts.temperature !== undefined
            ? opts.temperature
            : parseFloat(options.getOption('aiTemperature') || '0.7');

        const systemPrompt = this.getSystemPrompt(opts.systemPrompt || options.getOption('aiSystemPrompt'));

        try {
            // Determine whether to use the formatter or send messages directly
            let messagesToSend: Message[];

            if (opts.bypassFormatter) {
                // Bypass the formatter entirely - use messages as is
                messagesToSend = [...messages];
                console.log(`Bypassing formatter for Ollama request with ${messages.length} messages`);
            } else {
                // Use the formatter to prepare messages
                messagesToSend = this.formatter.formatMessages(
                    messages,
                    systemPrompt,
                    undefined, // context
                    opts.preserveSystemPrompt
                );
                console.log(`Sending to Ollama with formatted messages:`, JSON.stringify(messagesToSend, null, 2));
            }

            // Check if this is a request that expects JSON response
            const expectsJsonResponse = opts.expectsJsonResponse || false;

            if (expectsJsonResponse) {
                console.log(`Request expects JSON response, adding response_format parameter`);
            }

            const response = await fetch(`${apiBase}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages: messagesToSend,
                    options: {
                        temperature,
                        // Add response_format for requests that expect JSON
                        ...(expectsJsonResponse ? { response_format: { type: "json_object" } } : {})
                    },
                    stream: false
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Ollama API error: ${response.status} ${response.statusText}`, errorBody);
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data: OllamaResponse = await response.json();
            console.log('Raw response from Ollama:', JSON.stringify(data, null, 2));
            console.log('Parsed Ollama response:', JSON.stringify(data, null, 2));

            return {
                text: data.message.content,
                model: data.model,
                provider: this.getName(),
                usage: {
                    promptTokens: data.prompt_eval_count,
                    completionTokens: data.eval_count,
                    totalTokens: data.prompt_eval_count + data.eval_count
                }
            };
        } catch (error) {
            console.error('Ollama service error:', error);
            throw error;
        }
    }
}
