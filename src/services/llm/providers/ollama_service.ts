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
     * Clean up HTML and other problematic content before sending to Ollama
     */
    private cleanContextContent(content: string): string {
        if (!content) return '';

        try {
            // First fix potential encoding issues
            let sanitized = content
                // Fix common encoding issues with quotes and special characters
                .replace(/Γ\u00c2[\u00a3\u00a5]/g, '"')  // Fix broken quote chars
                .replace(/[\u00A0-\u9999]/g, match => {
                    try {
                        return encodeURIComponent(match).replace(/%/g, '');
                    } catch (e) {
                        return '';
                    }
                });

            // Replace common HTML tags with markdown or plain text equivalents
            sanitized = sanitized
                // Remove HTML divs, spans, etc.
                .replace(/<\/?div[^>]*>/g, '')
                .replace(/<\/?span[^>]*>/g, '')
                .replace(/<\/?p[^>]*>/g, '\n')
                // Convert headers
                .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
                .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
                .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
                // Convert lists
                .replace(/<\/?ul[^>]*>/g, '')
                .replace(/<\/?ol[^>]*>/g, '')
                .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
                // Convert links
                .replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
                // Convert code blocks
                .replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```')
                .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
                // Convert emphasis
                .replace(/<\/?strong[^>]*>/g, '**')
                .replace(/<\/?em[^>]*>/g, '*')
                // Remove figure tags
                .replace(/<\/?figure[^>]*>/g, '')
                // Remove all other HTML tags
                .replace(/<[^>]*>/g, '')
                // Fix double line breaks
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                // Fix HTML entities
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                // Final clean whitespace
                .replace(/\s+/g, ' ')
                .replace(/\n\s+/g, '\n')
                .trim();

            return sanitized;
        } catch (error) {
            console.error("Error cleaning context content:", error);
            return content; // Return original if cleaning fails
        }
    }

    /**
     * Format messages for the Ollama API
     */
    private formatMessages(messages: Message[], systemPrompt: string): OllamaMessage[] {
        const formattedMessages: OllamaMessage[] = [];
        const MAX_SYSTEM_CONTENT_LENGTH = 4000;

        // First identify user and system messages
        const systemMessages = messages.filter(msg => msg.role === 'system');
        const userMessages = messages.filter(msg => msg.role === 'user' || msg.role === 'assistant');

        // In the case of Ollama, we need to ensure context is properly integrated
        // The key insight is that simply including it in a system message doesn't work well

        // Check if we have context (typically in the first system message)
        let hasContext = false;
        let contextContent = '';

        if (systemMessages.length > 0) {
            const potentialContext = systemMessages[0].content;
            if (potentialContext && potentialContext.includes('# Context for your query')) {
                hasContext = true;
                contextContent = this.cleanContextContent(potentialContext);
            }
        }

        // Create base system message with instructions
        let basePrompt = systemPrompt ||
            "You are an AI assistant integrated into TriliumNext Notes. " +
            "Focus on helping users find information in their notes and answering questions based on their knowledge base. " +
            "Be concise, informative, and direct when responding to queries.";

        // If we have context, inject it differently - prepend it to the user's first question
        if (hasContext && userMessages.length > 0) {
            // Create initial system message with just the base prompt
            formattedMessages.push({
                role: 'system',
                content: basePrompt
            });

            // For user messages, inject context into the first user message
            let injectedContext = false;

            for (let i = 0; i < userMessages.length; i++) {
                const msg = userMessages[i];

                if (msg.role === 'user' && !injectedContext) {
                    // Format the context in a way Ollama can't ignore
                    const formattedContext =
                        "I need you to answer based on the following information from my notes:\n\n" +
                        "-----BEGIN MY NOTES-----\n" +
                        contextContent +
                        "\n-----END MY NOTES-----\n\n" +
                        "Based on these notes, please answer: " + msg.content;

                    formattedMessages.push({
                        role: 'user',
                        content: formattedContext
                    });

                    injectedContext = true;
                } else {
                    formattedMessages.push({
                        role: msg.role,
                        content: msg.content
                    });
                }
            }
        } else {
            // No context or empty context case
            // Add system message (with system prompt)
            if (systemPrompt) {
                formattedMessages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            // Add all user and assistant messages as-is
            for (const msg of userMessages) {
                formattedMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }

        console.log(`Formatted ${messages.length} messages into ${formattedMessages.length} messages for Ollama`);
        console.log(`Context detected: ${hasContext ? 'Yes' : 'No'}`);

        return formattedMessages;
    }
}
