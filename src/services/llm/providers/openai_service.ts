import options from '../../options.js';
import { BaseAIService } from '../base_ai_service.js';
import type { ChatCompletionOptions, ChatResponse, Message } from '../ai_interface.js';
import { PROVIDER_CONSTANTS } from '../constants/provider_constants.js';
import type { OpenAIOptions } from './provider_options.js';
import { getOpenAIOptions } from './providers.js';

export class OpenAIService extends BaseAIService {
    constructor() {
        super('OpenAI');
    }

    isAvailable(): boolean {
        return super.isAvailable() && !!options.getOption('openaiApiKey');
    }

    async generateChatCompletion(messages: Message[], opts: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!this.isAvailable()) {
            throw new Error('OpenAI service is not available. Check API key and AI settings.');
        }

        // Get provider-specific options from the central provider manager
        const providerOptions = getOpenAIOptions(opts);

        const systemPrompt = this.getSystemPrompt(providerOptions.systemPrompt || options.getOption('aiSystemPrompt'));

        // Ensure we have a system message
        const systemMessageExists = messages.some(m => m.role === 'system');
        const messagesWithSystem = systemMessageExists
            ? messages
            : [{ role: 'system', content: systemPrompt }, ...messages];

        try {
            // Fix endpoint construction - ensure we don't double up on /v1
            const normalizedBaseUrl = providerOptions.baseUrl.replace(/\/+$/, '');
            const endpoint = normalizedBaseUrl.includes('/v1')
                ? `${normalizedBaseUrl}/chat/completions`
                : `${normalizedBaseUrl}/v1/chat/completions`;

            // Create request body directly from provider options
            const requestBody: any = {
                model: providerOptions.model,
                messages: messagesWithSystem,
            };

            // Extract API parameters from provider options
            const apiParams = {
                temperature: providerOptions.temperature,
                max_tokens: providerOptions.max_tokens,
                stream: providerOptions.stream,
                top_p: providerOptions.top_p,
                frequency_penalty: providerOptions.frequency_penalty,
                presence_penalty: providerOptions.presence_penalty
            };



            // Merge API parameters, filtering out undefined values
            Object.entries(apiParams).forEach(([key, value]) => {
                if (value !== undefined) {
                    requestBody[key] = value;
                }
            });

            // Add tools if enabled
            if (providerOptions.enableTools && providerOptions.tools && providerOptions.tools.length > 0) {
                requestBody.tools = providerOptions.tools;
            }

            if (providerOptions.tool_choice) {
                requestBody.tool_choice = providerOptions.tool_choice;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${providerOptions.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }

            const data = await response.json();

            return {
                text: data.choices[0].message.content,
                model: data.model,
                provider: this.getName(),
                usage: {
                    promptTokens: data.usage?.prompt_tokens,
                    completionTokens: data.usage?.completion_tokens,
                    totalTokens: data.usage?.total_tokens
                },
                tool_calls: data.choices[0].message.tool_calls
            };
        } catch (error) {
            console.error('OpenAI service error:', error);
            throw error;
        }
    }
}
