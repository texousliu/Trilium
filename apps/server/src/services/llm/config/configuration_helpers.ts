import configurationManager from './configuration_manager.js';
import optionService from '../../options.js';
import log from '../../log.js';
import type {
    ProviderType,
    ModelIdentifier,
    ModelConfig,
} from '../interfaces/configuration_interfaces.js';

/**
 * Helper functions for accessing AI configuration without string parsing
 * Use these throughout the codebase instead of parsing strings directly
 */

/**
 * Get the selected AI provider
 */
export async function getSelectedProvider(): Promise<ProviderType | null> {
    const providerOption = optionService.getOption('aiSelectedProvider');
    return providerOption as ProviderType || null;
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
 * Get the currently selected provider if it's available and configured
 */
export async function getAvailableSelectedProvider(): Promise<ProviderType | null> {
    const selectedProvider = await getSelectedProvider();
    
    if (!selectedProvider) {
        return null; // No provider selected
    }

    if (await isProviderConfigured(selectedProvider)) {
        return selectedProvider;
    }

    return null; // Selected provider is not properly configured
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
 * Get the model configuration for the currently selected provider
 */
export async function getSelectedModelConfig(): Promise<{ model: string; provider: ProviderType } | null> {
    const selectedProvider = await getSelectedProvider();
    
    if (!selectedProvider) {
        return null; // No provider selected
    }

    return await getValidModelConfig(selectedProvider);
}

