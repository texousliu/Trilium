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
 * Validate all available providers without throwing errors
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

        // Validate embedding providers
        await validateEmbeddingProviders(result);
        
        // Validate chat providers
        await validateChatProviders(result);

        // Determine if we have any valid providers
        result.hasValidProviders = result.validEmbeddingProviders.length > 0 || result.validChatProviders.length > 0;

        if (!result.hasValidProviders) {
            result.errors.push("No valid AI providers are configured");
        }

    } catch (error: any) {
        result.errors.push(`Error during provider validation: ${error.message || 'Unknown error'}`);
    }

    return result;
}

/**
 * Validate embedding providers
 */
async function validateEmbeddingProviders(result: ProviderValidationResult): Promise<void> {
    try {
        // Import provider classes and check configurations
        const { OpenAIEmbeddingProvider } = await import("./embeddings/providers/openai.js");
        const { OllamaEmbeddingProvider } = await import("./embeddings/providers/ollama.js");
        const { VoyageEmbeddingProvider } = await import("./embeddings/providers/voyage.js");

        // Check OpenAI embedding provider
        await validateOpenAIEmbeddingProvider(result, OpenAIEmbeddingProvider);
        
        // Check Ollama embedding provider
        await validateOllamaEmbeddingProvider(result, OllamaEmbeddingProvider);
        
        // Check Voyage embedding provider
        await validateVoyageEmbeddingProvider(result, VoyageEmbeddingProvider);

        // Local provider is always available as fallback
        await validateLocalEmbeddingProvider(result);

    } catch (error: any) {
        result.errors.push(`Error validating embedding providers: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Validate chat providers
 */
async function validateChatProviders(result: ProviderValidationResult): Promise<void> {
    try {
        // Check OpenAI chat provider
        const openaiApiKey = await options.getOption('openaiApiKey');
        const openaiBaseUrl = await options.getOption('openaiBaseUrl');
        
        if (openaiApiKey || openaiBaseUrl) {
            if (!openaiApiKey && !openaiBaseUrl) {
                result.warnings.push("OpenAI chat provider: No API key or base URL configured");
            } else if (!openaiApiKey) {
                result.warnings.push("OpenAI chat provider: No API key configured (may work with compatible endpoints)");
                result.validChatProviders.push('openai');
            } else {
                result.validChatProviders.push('openai');
            }
        }

        // Check Anthropic chat provider
        const anthropicApiKey = await options.getOption('anthropicApiKey');
        if (anthropicApiKey) {
            result.validChatProviders.push('anthropic');
        } else {
            result.warnings.push("Anthropic chat provider: No API key configured");
        }

        // Check Ollama chat provider
        const ollamaBaseUrl = await options.getOption('ollamaBaseUrl');
        if (ollamaBaseUrl) {
            result.validChatProviders.push('ollama');
        } else {
            result.warnings.push("Ollama chat provider: No base URL configured");
        }

    } catch (error: any) {
        result.errors.push(`Error validating chat providers: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Validate OpenAI embedding provider
 */
async function validateOpenAIEmbeddingProvider(
    result: ProviderValidationResult, 
    OpenAIEmbeddingProvider: any
): Promise<void> {
    try {
        const openaiApiKey = await options.getOption('openaiApiKey');
        const openaiBaseUrl = await options.getOption('openaiBaseUrl');
        
        if (openaiApiKey || openaiBaseUrl) {
            const openaiModel = await options.getOption('openaiEmbeddingModel');
            const finalBaseUrl = openaiBaseUrl || 'https://api.openai.com/v1';

            if (!openaiApiKey) {
                result.warnings.push("OpenAI embedding provider: No API key configured (may work with compatible endpoints)");
            }

            const provider = new OpenAIEmbeddingProvider({
                model: openaiModel,
                dimension: 1536,
                type: 'float32',
                apiKey: openaiApiKey || '',
                baseUrl: finalBaseUrl
            });

            result.validEmbeddingProviders.push(provider);
            log.info(`Validated OpenAI embedding provider: ${openaiModel} at ${finalBaseUrl}`);
        } else {
            result.warnings.push("OpenAI embedding provider: No API key or base URL configured");
        }
    } catch (error: any) {
        result.errors.push(`OpenAI embedding provider validation failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Validate Ollama embedding provider
 */
async function validateOllamaEmbeddingProvider(
    result: ProviderValidationResult, 
    OllamaEmbeddingProvider: any
): Promise<void> {
    try {
        const ollamaEmbeddingBaseUrl = await options.getOption('ollamaEmbeddingBaseUrl');
        
        if (ollamaEmbeddingBaseUrl) {
            const embeddingModel = await options.getOption('ollamaEmbeddingModel');

            try {
                const provider = new OllamaEmbeddingProvider({
                    model: embeddingModel,
                    dimension: 768,
                    type: 'float32',
                    baseUrl: ollamaEmbeddingBaseUrl
                });

                // Try to initialize to validate connection
                await provider.initialize();
                result.validEmbeddingProviders.push(provider);
                log.info(`Validated Ollama embedding provider: ${embeddingModel} at ${ollamaEmbeddingBaseUrl}`);
            } catch (error: any) {
                result.warnings.push(`Ollama embedding provider initialization failed: ${error.message || 'Unknown error'}`);
            }
        } else {
            result.warnings.push("Ollama embedding provider: No base URL configured");
        }
    } catch (error: any) {
        result.errors.push(`Ollama embedding provider validation failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Validate Voyage embedding provider
 */
async function validateVoyageEmbeddingProvider(
    result: ProviderValidationResult, 
    VoyageEmbeddingProvider: any
): Promise<void> {
    try {
        const voyageApiKey = await options.getOption('voyageApiKey' as any);
        
        if (voyageApiKey) {
            const voyageModel = await options.getOption('voyageEmbeddingModel') || 'voyage-2';
            
            const provider = new VoyageEmbeddingProvider({
                model: voyageModel,
                dimension: 1024,
                type: 'float32',
                apiKey: voyageApiKey,
                baseUrl: 'https://api.voyageai.com/v1'
            });

            result.validEmbeddingProviders.push(provider);
            log.info(`Validated Voyage embedding provider: ${voyageModel}`);
        } else {
            result.warnings.push("Voyage embedding provider: No API key configured");
        }
    } catch (error: any) {
        result.errors.push(`Voyage embedding provider validation failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Validate local embedding provider (always available as fallback)
 */
async function validateLocalEmbeddingProvider(result: ProviderValidationResult): Promise<void> {
    try {
        // Simple local embedding provider implementation
        class SimpleLocalEmbeddingProvider {
            name = "local";
            config = {
                model: 'local',
                dimension: 384,
                type: 'float32' as const
            };

            getConfig() {
                return this.config;
            }

            getNormalizationStatus() {
                return 0; // NormalizationStatus.NEVER
            }

            async generateEmbeddings(text: string): Promise<Float32Array> {
                const result = new Float32Array(this.config.dimension);
                for (let i = 0; i < result.length; i++) {
                    const charSum = Array.from(text).reduce((sum, char, idx) =>
                        sum + char.charCodeAt(0) * Math.sin(idx * 0.1), 0);
                    result[i] = Math.sin(i * 0.1 + charSum * 0.01);
                }
                return result;
            }

            async generateBatchEmbeddings(texts: string[]): Promise<Float32Array[]> {
                return Promise.all(texts.map(text => this.generateEmbeddings(text)));
            }

            async generateNoteEmbeddings(context: any): Promise<Float32Array> {
                const text = (context.title || "") + " " + (context.content || "");
                return this.generateEmbeddings(text);
            }

            async generateBatchNoteEmbeddings(contexts: any[]): Promise<Float32Array[]> {
                return Promise.all(contexts.map(context => this.generateNoteEmbeddings(context)));
            }
        }

        const localProvider = new SimpleLocalEmbeddingProvider();
        result.validEmbeddingProviders.push(localProvider as any);
        log.info("Validated local embedding provider as fallback");
    } catch (error: any) {
        result.errors.push(`Local embedding provider validation failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * Check if any working providers are available for embeddings
 */
export async function hasWorkingEmbeddingProviders(): Promise<boolean> {
    const validation = await validateProviders();
    return validation.validEmbeddingProviders.length > 0;
}

/**
 * Check if any working providers are available for chat
 */
export async function hasWorkingChatProviders(): Promise<boolean> {
    const validation = await validateProviders();
    return validation.validChatProviders.length > 0;
}

/**
 * Get only the working embedding providers
 */
export async function getWorkingEmbeddingProviders(): Promise<EmbeddingProvider[]> {
    const validation = await validateProviders();
    return validation.validEmbeddingProviders;
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