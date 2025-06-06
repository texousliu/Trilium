/**
 * Provider Validation Service
 * 
 * Validates AI provider configurations before initializing the embedding system.
 * This prevents startup errors when AI is enabled but providers are misconfigured.
 */

import log from "../log.js";
import options from "../options.js";
import type { EmbeddingProvider } from "./embeddings/embeddings_interface.js";

export interface ProviderValidationResult {
    hasValidProviders: boolean;
    validEmbeddingProviders: EmbeddingProvider[];
    validChatProviders: string[];
    errors: string[];
    warnings: string[];
}

/**
 * Simplified provider validation - just checks configuration without creating providers
 */
export async function validateProviders(): Promise<ProviderValidationResult> {
    const result: ProviderValidationResult = {
        hasValidProviders: false,
        validEmbeddingProviders: [],
        validChatProviders: [],
        errors: [],
        warnings: []
    };

    try {
        // Check if AI is enabled
        const aiEnabled = await options.getOptionBool('aiEnabled');
        if (!aiEnabled) {
            result.warnings.push("AI features are disabled");
            return result;
        }

        // Check configuration only - don't create providers
        await checkEmbeddingProviderConfigs(result);
        await checkChatProviderConfigs(result);

        // Determine if we have any valid providers based on configuration
        result.hasValidProviders = result.validChatProviders.length > 0;

        if (!result.hasValidProviders) {
            result.errors.push("No valid AI providers are configured");
        }

    } catch (error: any) {
        result.errors.push(`Error during provider validation: ${error.message || 'Unknown error'}`);
    }

    return result;
}

/**
 * Check embedding provider configurations without creating providers
 */
async function checkEmbeddingProviderConfigs(result: ProviderValidationResult): Promise<void> {
    try {
        // Check OpenAI embedding configuration
        const openaiApiKey = await options.getOption('openaiApiKey');
        const openaiBaseUrl = await options.getOption('openaiBaseUrl');
        if (openaiApiKey || openaiBaseUrl) {
            if (!openaiApiKey) {
                result.warnings.push("OpenAI embedding: No API key (may work with compatible endpoints)");
            }
            log.info("OpenAI embedding provider configuration available");
        }

        // Check Ollama embedding configuration
        const ollamaEmbeddingBaseUrl = await options.getOption('ollamaEmbeddingBaseUrl');
        if (ollamaEmbeddingBaseUrl) {
            log.info("Ollama embedding provider configuration available");
        }

        // Check Voyage embedding configuration
        const voyageApiKey = await options.getOption('voyageApiKey' as any);
        if (voyageApiKey) {
            log.info("Voyage embedding provider configuration available");
        }

        // Local provider is always available
        log.info("Local embedding provider available as fallback");

    } catch (error: any) {
        result.errors.push(`Error checking embedding provider configs: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Check chat provider configurations without creating providers
 */
async function checkChatProviderConfigs(result: ProviderValidationResult): Promise<void> {
    try {
        // Check OpenAI chat provider
        const openaiApiKey = await options.getOption('openaiApiKey');
        const openaiBaseUrl = await options.getOption('openaiBaseUrl');
        
        if (openaiApiKey || openaiBaseUrl) {
            if (!openaiApiKey) {
                result.warnings.push("OpenAI chat: No API key (may work with compatible endpoints)");
            }
            result.validChatProviders.push('openai');
        }

        // Check Anthropic chat provider
        const anthropicApiKey = await options.getOption('anthropicApiKey');
        if (anthropicApiKey) {
            result.validChatProviders.push('anthropic');
        }

        // Check Ollama chat provider
        const ollamaBaseUrl = await options.getOption('ollamaBaseUrl');
        if (ollamaBaseUrl) {
            result.validChatProviders.push('ollama');
        }

        if (result.validChatProviders.length === 0) {
            result.warnings.push("No chat providers configured. Please configure at least one provider.");
        }

    } catch (error: any) {
        result.errors.push(`Error checking chat provider configs: ${error.message || 'Unknown error'}`);
    }
}


/**
 * Check if any chat providers are configured
 */
export async function hasWorkingChatProviders(): Promise<boolean> {
    const validation = await validateProviders();
    return validation.validChatProviders.length > 0;
}

/**
 * Check if any embedding providers are configured (simplified)
 */
export async function hasWorkingEmbeddingProviders(): Promise<boolean> {
    if (!(await options.getOptionBool('aiEnabled'))) {
        return false;
    }
    
    // Check if any embedding provider is configured
    const openaiKey = await options.getOption('openaiApiKey');
    const openaiBaseUrl = await options.getOption('openaiBaseUrl');
    const ollamaUrl = await options.getOption('ollamaEmbeddingBaseUrl');
    const voyageKey = await options.getOption('voyageApiKey' as any);
    
    // Local provider is always available as fallback
    return !!(openaiKey || openaiBaseUrl || ollamaUrl || voyageKey) || true;
}

/**
 * Log validation results in a user-friendly way
 */
export function logValidationResults(validation: ProviderValidationResult): void {
    if (validation.hasValidProviders) {
        log.info(`AI provider validation passed: ${validation.validEmbeddingProviders.length} embedding providers, ${validation.validChatProviders.length} chat providers`);
        
        if (validation.validEmbeddingProviders.length > 0) {
            log.info(`Working embedding providers: ${validation.validEmbeddingProviders.map(p => p.name).join(', ')}`);
        }
        
        if (validation.validChatProviders.length > 0) {
            log.info(`Working chat providers: ${validation.validChatProviders.join(', ')}`);
        }
    } else {
        log.info("AI provider validation failed: No working providers found");
    }

    validation.warnings.forEach(warning => log.info(`Provider validation: ${warning}`));
    validation.errors.forEach(error => log.error(`Provider validation: ${error}`));
}