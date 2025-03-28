import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { ChatCompletionOptions, ChatResponse, Message } from '../ai_interface.js';
import { PROVIDER_CONSTANTS } from '../constants/provider_constants.js';

interface OllamaMessage {
    role: string;
    content: string;
}

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

        const baseUrl = options.getOption('ollamaBaseUrl') || PROVIDER_CONSTANTS.OLLAMA.BASE_URL;
        const model = opts.model || options.getOption('ollamaDefaultModel') || PROVIDER_CONSTANTS.OLLAMA.DEFAULT_MODEL;
        const temperature = opts.temperature !== undefined
            ? opts.temperature
            : parseFloat(options.getOption('aiTemperature') || '0.7');

        const systemPrompt = this.getSystemPrompt(opts.systemPrompt || options.getOption('aiSystemPrompt'));

        // Format messages for Ollama
        const formattedMessages = this.formatMessages(messages, systemPrompt);

        // Log the formatted messages for debugging
        console.log('Input messages for formatting:', messages);
        console.log('Formatted messages for Ollama:', formattedMessages);

        try {
            const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/chat`;

            // Determine if we should stream the response
            const shouldStream = opts.stream === true;

            if (shouldStream) {
                // Handle streaming response
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages: formattedMessages,
                        stream: true,
                        options: {
                            temperature,
                        }
                    })
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorBody}`);
                }

                // For streaming, we return an object that has a callback for handling the stream
                return {
                    text: "", // Initial empty text that will be built up
                    model: model,
                    provider: this.getName(),
                    usage: {
                        promptTokens: 0,
                        completionTokens: 0,
                        totalTokens: 0
                    },
                    stream: async (callback) => {
                        if (!response.body) {
                            throw new Error("No response body from Ollama");
                        }

                        const reader = response.body.getReader();
                        let fullText = "";
                        let partialLine = "";
                        let receivedAnyContent = false;

                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                // Convert the chunk to text
                                const chunk = new TextDecoder().decode(value);
                                partialLine += chunk;

                                // Split by lines and process each complete JSON object
                                const lines = partialLine.split('\n');

                                // Process all complete lines except the last one (which might be incomplete)
                                for (let i = 0; i < lines.length - 1; i++) {
                                    const line = lines[i].trim();
                                    if (!line) continue;

                                    try {
                                        const data = JSON.parse(line);
                                        console.log("Streaming chunk received:", data);

                                        if (data.message && data.message.content) {
                                            // Extract just the new content
                                            const newContent = data.message.content;
                                            // Add to full text
                                            fullText += newContent;
                                            receivedAnyContent = true;
                                            // Call the callback with the new content
                                            await callback({
                                                text: newContent,
                                                done: false
                                            });
                                        }

                                        if (data.done) {
                                            // If we received an empty response with done=true,
                                            // generate a fallback response
                                            if (!receivedAnyContent && fullText.trim() === "") {
                                                // Generate a fallback response
                                                const fallbackText = "I've processed your request but don't have a specific response for you at this time.";
                                                await callback({
                                                    text: fallbackText,
                                                    done: false
                                                });
                                                fullText = fallbackText;
                                            }

                                            // Final message in the stream
                                            await callback({
                                                text: "",
                                                done: true,
                                                usage: {
                                                    promptTokens: data.prompt_eval_count || 0,
                                                    completionTokens: data.eval_count || 0,
                                                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                                                }
                                            });
                                        }
                                    } catch (err) {
                                        console.error("Error parsing JSON from Ollama stream:", err, "Line:", line);
                                    }
                                }

                                // Keep the potentially incomplete last line for the next iteration
                                partialLine = lines[lines.length - 1];
                            }

                            // Handle any remaining content in partialLine
                            if (partialLine.trim()) {
                                try {
                                    const data = JSON.parse(partialLine.trim());
                                    if (data.message && data.message.content) {
                                        fullText += data.message.content;
                                        receivedAnyContent = true;
                                        await callback({
                                            text: data.message.content,
                                            done: false
                                        });
                                    }

                                    if (data.done) {
                                        // Check for empty responses
                                        if (!receivedAnyContent && fullText.trim() === "") {
                                            // Generate a fallback response
                                            const fallbackText = "I've processed your request but don't have a specific response for you at this time.";
                                            await callback({
                                                text: fallbackText,
                                                done: false
                                            });
                                            fullText = fallbackText;
                                        }

                                        await callback({
                                            text: "",
                                            done: true,
                                            usage: {
                                                promptTokens: data.prompt_eval_count || 0,
                                                completionTokens: data.eval_count || 0,
                                                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                                            }
                                        });
                                    }
                                } catch (err) {
                                    console.error("Error parsing JSON from last line:", err, "Line:", partialLine);
                                }
                            }

                            // If we reached the end without a done message and without any content
                            if (!receivedAnyContent && fullText.trim() === "") {
                                // Generate a fallback response
                                const fallbackText = "I've processed your request but don't have a specific response for you at this time.";
                                await callback({
                                    text: fallbackText,
                                    done: false
                                });

                                // Final message
                                await callback({
                                    text: "",
                                    done: true,
                                    usage: {
                                        promptTokens: 0,
                                        completionTokens: 0,
                                        totalTokens: 0
                                    }
                                });
                            }

                            return fullText;
                        } catch (err) {
                            console.error("Error processing Ollama stream:", err);
                            throw err;
                        }
                    }
                };
            } else {
                // Non-streaming response - explicitly request JSON format
                console.log("Sending to Ollama with formatted messages:", JSON.stringify(formattedMessages, null, 2));

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages: formattedMessages,
                        stream: false,
                        options: {
                            temperature,
                        }
                    })
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorBody}`);
                }

                const rawResponseText = await response.text();
                console.log("Raw response from Ollama:", rawResponseText);

                let data;

                try {
                    data = JSON.parse(rawResponseText);
                    console.log("Parsed Ollama response:", JSON.stringify(data, null, 2));
                } catch (err: any) {
                    console.error("Error parsing JSON response from Ollama:", err);
                    console.error("Raw response:", rawResponseText);
                    throw new Error(`Failed to parse Ollama response as JSON: ${err.message}`);
                }

                // Check for empty or JSON object responses
                const content = data.message?.content || '';
                let finalResponseText = content;

                if (content === '{}' || content === '{  }' || content === '{ }') {
                    finalResponseText = "I don't have information about that in my notes.";
                } else if (!content.trim()) {
                    finalResponseText = "No response was generated. Please try asking a different question.";
                }

                return {
                    text: finalResponseText,
                    model: data.model || model,
                    provider: this.getName(),
                    usage: {
                        promptTokens: data.prompt_eval_count || 0,
                        completionTokens: data.eval_count || 0,
                        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                    }
                };
            }
        } catch (error: any) {
            console.error("Ollama service error:", error);
            throw new Error(`Ollama service error: ${error.message}`);
        }
    }

    /**
     * Format messages for the Ollama API
     */
    private formatMessages(messages: Message[], systemPrompt: string): OllamaMessage[] {
        const formattedMessages: OllamaMessage[] = [];

        // Add system message if provided
        if (systemPrompt) {
            formattedMessages.push({
                role: 'system',
                content: systemPrompt
            });
        }

        // Add all messages
        for (const msg of messages) {
            // Ollama's API accepts 'user', 'assistant', and 'system' roles
            formattedMessages.push({
                role: msg.role,
                content: msg.content
            });
        }

        return formattedMessages;
    }
}
