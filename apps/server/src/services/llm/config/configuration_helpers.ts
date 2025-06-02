import configurationManager from './configuration_manager.js';
import type {
    ProviderType,
    ModelIdentifier,
    ModelConfig,
    ProviderPrecedenceConfig,
    EmbeddingProviderPrecedenceConfig
} from '../interfaces/configuration_interfaces.js';

/**
 * Helper functions for accessing AI configuration without string parsing
 * Use these throughout the codebase instead of parsing strings directly
 */

/**
 * Get the ordered list of AI providers
 */
export async function getProviderPrecedence(): Promise<ProviderType[]> {
    const config = await configurationManager.getProviderPrecedence();
    return config.providers;
}

/**
 * Get the default/preferred AI provider
 */
export async function getPreferredProvider(): Promise<ProviderType | null> {
    const config = await configurationManager.getProviderPrecedence();
    if (config.providers.length === 0) {
        return null; // No providers configured
    }
    return config.defaultProvider || config.providers[0];
}

/**
 * Get the ordered list of embedding providers
 */
export async function getEmbeddingProviderPrecedence(): Promise<string[]> {
    const config = await configurationManager.getEmbeddingProviderPrecedence();
    return config.providers;
}

/**
 * Get the default embedding provider
 */
export async function getPreferredEmbeddingProvider(): Promise<string | null> {
    const config = await configurationManager.getEmbeddingProviderPrecedence();
    if (config.providers.length === 0) {
        return null; // No providers configured
    }
    return config.defaultProvider || config.providers[0];
}

/**
 * Parse a model identifier (handles "provider:model" format)
 */
export function parseModelIdentifier(modelString: string): ModelIdentifier {
    return configurationManager.parseModelIdentifier(modelString);
}

/**
 * Create a model configuration from a model string
 */
export function createModelConfig(modelString: string, defaultProvider?: ProviderType): ModelConfig {
    return configurationManager.createModelConfig(modelString, defaultProvider);
}

/**
 * Get the default model for a specific provider
 */
export async function getDefaultModelForProvider(provider: ProviderType): Promise<string | undefined> {
    const config = await configurationManager.getAIConfig();
    return config.defaultModels[provider]; // This can now be undefined
}

/**
 * Get provider settings for a specific provider
 */
export async function getProviderSettings(provider: ProviderType) {
    const config = await configurationManager.getAIConfig();
    return config.providerSettings[provider];
}

/**
 * Check if AI is enabled
 */
export async function isAIEnabled(): Promise<boolean> {
    const config = await configurationManager.getAIConfig();
    return config.enabled;
}

/**
 * Check if a provider has required configuration
 */
export async function isProviderConfigured(provider: ProviderType): Promise<boolean> {
    const settings = await getProviderSettings(provider);

    switch (provider) {
        case 'openai':
            return Boolean((settings as any)?.apiKey);
        case 'anthropic':
            return Boolean((settings as any)?.apiKey);
        case 'ollama':
            return Boolean((settings as any)?.baseUrl);
        default:
            return false;
    }
}

/**
 * Get the first available (configured) provider from the precedence list
 */
export async function getFirstAvailableProvider(): Promise<ProviderType | null> {
    const providers = await getProviderPrecedence();

    if (providers.length === 0) {
        return null; // No providers configured
    }

    for (const provider of providers) {
        if (await isProviderConfigured(provider)) {
            return provider;
        }
    }

    return null; // No providers are properly configured
}

/**
 * Validate the current AI configuration
 */
export async function validateConfiguration() {
    return configurationManager.validateConfig();
}

/**
 * Clear cached configuration (use when settings change)
 */
export function clearConfigurationCache(): void {
    configurationManager.clearCache();
}

/**
 * Get a model configuration with validation that no defaults are assumed
 */
export async function getValidModelConfig(provider: ProviderType): Promise<{ model: string; provider: ProviderType } | null> {
    const defaultModel = await getDefaultModelForProvider(provider);

    if (!defaultModel) {
        // No default model configured for this provider
        return null;
    }

    const isConfigured = await isProviderConfigured(provider);
    if (!isConfigured) {
        // Provider is not properly configured
        return null;
    }

    return {
        model: defaultModel,
        provider
    };
}

/**
 * Get the first valid model configuration from the provider precedence list
 */
export async function getFirstValidModelConfig(): Promise<{ model: string; provider: ProviderType } | null> {
    const providers = await getProviderPrecedence();

    for (const provider of providers) {
        const config = await getValidModelConfig(provider);
        if (config) {
            return config;
        }
    }

    return null; // No valid model configuration found
}
