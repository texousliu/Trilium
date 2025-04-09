import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { ChatCompletionOptions, ChatResponse, Message } from '../ai_interface.js';
import { PROVIDER_CONSTANTS } from '../constants/provider_constants.js';
import type { AnthropicOptions } from './provider_options.js';
import { getAnthropicOptions } from './providers.js';
import log from '../../log.js';

interface AnthropicMessage {
    role: string;
    content: string;
}

export class AnthropicService extends BaseAIService {
    constructor() {
        super('Anthropic');
    }

    isAvailable(): boolean {
        return super.isAvailable() && !!options.getOption('anthropicApiKey');
    }

    async generateChatCompletion(messages: Message[], opts: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!this.isAvailable()) {
            throw new Error('Anthropic service is not available. Check API key and AI settings.');
        }

        // Get provider-specific options from the central provider manager
        const providerOptions = getAnthropicOptions(opts);

        // Log provider metadata if available
        if (providerOptions.providerMetadata) {
            log.info(`Using model ${providerOptions.model} from provider ${providerOptions.providerMetadata.provider}`);

            // Log capabilities if available
            const capabilities = providerOptions.providerMetadata.capabilities;
            if (capabilities) {
                log.info(`Model capabilities: ${JSON.stringify(capabilities)}`);
            }
        }

        const systemPrompt = this.getSystemPrompt(providerOptions.systemPrompt || options.getOption('aiSystemPrompt'));

        // Format for Anthropic's API
        const formattedMessages = this.formatMessages(messages, systemPrompt);

        // Store the formatted messages in the provider options for future reference
        providerOptions.formattedMessages = formattedMessages;

        try {
            // Ensure base URL doesn't already include '/v1' and build the complete endpoint
            const cleanBaseUrl = providerOptions.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
            const endpoint = `${cleanBaseUrl}/v1/messages`;

            console.log(`Anthropic API endpoint: ${endpoint}`);
            console.log(`Using model: ${providerOptions.model}`);

            // Create request body directly from provider options
            const requestBody: any = {
                model: providerOptions.model,
                messages: formattedMessages.messages,
                system: formattedMessages.system,
            };

            // Extract API parameters from provider options
            const apiParams = {
                temperature: providerOptions.temperature,
                max_tokens: providerOptions.max_tokens,
                stream: providerOptions.stream,
                top_p: providerOptions.top_p
            };

            // Merge API parameters, filtering out undefined values
            Object.entries(apiParams).forEach(([key, value]) => {
                if (value !== undefined) {
                    requestBody[key] = value;
                }
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': providerOptions.apiKey,
                    'anthropic-version': providerOptions.apiVersion || PROVIDER_CONSTANTS.ANTHROPIC.API_VERSION,
                    'anthropic-beta': providerOptions.betaVersion || PROVIDER_CONSTANTS.ANTHROPIC.BETA_VERSION
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Anthropic API error (${response.status}): ${errorBody}`);
                throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();

            return {
                text: data.content[0].text,
                model: data.model,
                provider: this.getName(),
                usage: {
                    // Anthropic doesn't provide token usage in the same format as OpenAI
                    // but we can still estimate based on input/output length
                    totalTokens: data.usage?.input_tokens + data.usage?.output_tokens
                }
            };
        } catch (error) {
            console.error('Anthropic service error:', error);
            throw error;
        }
    }

    /**
     * Format messages for the Anthropic API
     */
    private formatMessages(messages: Message[], systemPrompt: string): { messages: AnthropicMessage[], system: string } {
        const formattedMessages: AnthropicMessage[] = [];

        // Extract the system message if present
        let sysPrompt = systemPrompt;

        // Process each message
        for (const msg of messages) {
            if (msg.role === 'system') {
                // Anthropic handles system messages separately
                sysPrompt = msg.content;
            } else {
                formattedMessages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        }

        return {
            messages: formattedMessages,
            system: sysPrompt
        };
    }
}
