import options from '../options.js';
import type { AIService, ChatCompletionOptions, ChatResponse, Message } from './ai_interface.js';
import { OpenAIService } from './openai_service.js';
import { AnthropicService } from './anthropic_service.js';
import { OllamaService } from './ollama_service.js';

type ServiceProviders = 'openai' | 'anthropic' | 'ollama';

export class AIServiceManager {
    private services: Record<ServiceProviders, AIService> = {
        openai: new OpenAIService(),
        anthropic: new AnthropicService(),
        ollama: new OllamaService()
    };

    private providerOrder: ServiceProviders[] = [];

    constructor() {
        this.updateProviderOrder();
    }

    /**
     * Update the provider precedence order from saved options
     */
    updateProviderOrder() {
        // Default precedence: openai, anthropic, ollama
        const defaultOrder: ServiceProviders[] = ['openai', 'anthropic', 'ollama'];

        // Get custom order from options
        const customOrder = options.getOption('aiProviderPrecedence');

        if (customOrder) {
            try {
                const parsed = JSON.parse(customOrder);
                // Validate that all providers are valid
                if (Array.isArray(parsed) &&
                    parsed.every(p => Object.keys(this.services).includes(p))) {
                    this.providerOrder = parsed as ServiceProviders[];
                } else {
                    console.warn('Invalid AI provider precedence format, using defaults');
                    this.providerOrder = defaultOrder;
                }
            } catch (e) {
                console.error('Failed to parse AI provider precedence:', e);
                this.providerOrder = defaultOrder;
            }
        } else {
            this.providerOrder = defaultOrder;
        }
    }

    /**
     * Check if any AI service is available
     */
    isAnyServiceAvailable(): boolean {
        return Object.values(this.services).some(service => service.isAvailable());
    }

    /**
     * Get list of available providers
     */
    getAvailableProviders(): ServiceProviders[] {
        return Object.entries(this.services)
            .filter(([_, service]) => service.isAvailable())
            .map(([key, _]) => key as ServiceProviders);
    }

    /**
     * Generate a chat completion response using the first available AI service
     * based on the configured precedence order
     */
    async generateChatCompletion(messages: Message[], options: ChatCompletionOptions = {}): Promise<ChatResponse> {
        if (!messages || messages.length === 0) {
            throw new Error('No messages provided for chat completion');
        }

        this.updateProviderOrder();

        // Try providers in order of preference
        const availableProviders = this.getAvailableProviders();

        if (availableProviders.length === 0) {
            throw new Error('No AI providers are available. Please check your AI settings.');
        }

        // Sort available providers by precedence
        const sortedProviders = this.providerOrder
            .filter(provider => availableProviders.includes(provider));

        // If a specific provider is requested and available, use it
        if (options.model && options.model.includes(':')) {
            const [providerName, modelName] = options.model.split(':');

            if (availableProviders.includes(providerName as ServiceProviders)) {
                try {
                    const modifiedOptions = { ...options, model: modelName };
                    return await this.services[providerName as ServiceProviders].generateChatCompletion(messages, modifiedOptions);
                } catch (error) {
                    console.error(`Error with specified provider ${providerName}:`, error);
                    // If the specified provider fails, continue with the fallback providers
                }
            }
        }

        // Try each provider in order until one succeeds
        let lastError: Error | null = null;

        for (const provider of sortedProviders) {
            try {
                return await this.services[provider].generateChatCompletion(messages, options);
            } catch (error) {
                console.error(`Error with provider ${provider}:`, error);
                lastError = error as Error;
                // Continue to the next provider
            }
        }

        // If we get here, all providers failed
        throw new Error(`All AI providers failed: ${lastError?.message || 'Unknown error'}`);
    }
}

// Singleton instance
const aiServiceManager = new AIServiceManager();
export default aiServiceManager;
