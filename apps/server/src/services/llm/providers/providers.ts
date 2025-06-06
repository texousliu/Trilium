import options from "../../options.js";
import log from "../../log.js";
import sql from "../../sql.js";
import dateUtils from "../../date_utils.js";
import { randomString } from "../../utils.js";
import type { EmbeddingProvider, EmbeddingConfig } from "../embeddings/embeddings_interface.js";
import { NormalizationStatus } from "../embeddings/embeddings_interface.js";
import { OpenAIEmbeddingProvider } from "../embeddings/providers/openai.js";
import { OllamaEmbeddingProvider } from "../embeddings/providers/ollama.js";
import { VoyageEmbeddingProvider } from "../embeddings/providers/voyage.js";
import type { OptionDefinitions } from "@triliumnext/commons";
import type { ChatCompletionOptions } from '../ai_interface.js';
import type { OpenAIOptions, AnthropicOptions, OllamaOptions, ModelMetadata } from './provider_options.js';
import {
    createOpenAIOptions,
    createAnthropicOptions,
    createOllamaOptions
} from './provider_options.js';
import { PROVIDER_CONSTANTS } from '../constants/provider_constants.js';
import { SEARCH_CONSTANTS, MODEL_CAPABILITIES } from '../constants/search_constants.js';

/**
 * Simple local embedding provider implementation
 * This avoids the need to import a separate file which might not exist
 */
class SimpleLocalEmbeddingProvider implements EmbeddingProvider {
    name = "local";
    config: EmbeddingConfig;

    constructor(config: EmbeddingConfig) {
        this.config = config;
    }

    getConfig(): EmbeddingConfig {
        return this.config;
    }

    /**
     * Returns the normalization status of the local provider
     * Local provider does not guarantee normalization
     */
    getNormalizationStatus(): NormalizationStatus {
        return NormalizationStatus.NEVER; // Simple embedding does not normalize vectors
    }

    async generateEmbeddings(text: string): Promise<Float32Array> {
        // Create deterministic embeddings based on text content
        const result = new Float32Array(this.config.dimension || 384);

        // Simple hash-based approach
        for (let i = 0; i < result.length; i++) {
            // Use character codes and position to generate values between -1 and 1
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
        // Combine text from context
        const text = (context.title || "") + " " + (context.content || "");
        return this.generateEmbeddings(text);
    }

    async generateBatchNoteEmbeddings(contexts: any[]): Promise<Float32Array[]> {
        return Promise.all(contexts.map(context => this.generateNoteEmbeddings(context)));
    }
}

const providers = new Map<string, EmbeddingProvider>();

// Cache to track which provider errors have been logged
const loggedProviderErrors = new Set<string>();

/**
 * Register a new embedding provider
 */
export function registerEmbeddingProvider(provider: EmbeddingProvider) {
    providers.set(provider.name, provider);
    log.info(`Registered embedding provider: ${provider.name}`);
}

/**
 * Unregister an embedding provider
 */
export function unregisterEmbeddingProvider(name: string): boolean {
    const existed = providers.has(name);
    if (existed) {
        providers.delete(name);
        log.info(`Unregistered embedding provider: ${name}`);
    }
    return existed;
}

/**
 * Clear all embedding providers
 */
export function clearAllEmbeddingProviders(): void {
    const providerNames = Array.from(providers.keys());
    providers.clear();
    if (providerNames.length > 0) {
        log.info(`Cleared all embedding providers: ${providerNames.join(', ')}`);
    }
}

/**
 * Get all registered embedding providers
 */
export function getEmbeddingProviders(): EmbeddingProvider[] {
    return Array.from(providers.values());
}

/**
 * Get a specific embedding provider by name
 */
export function getEmbeddingProvider(name: string): EmbeddingProvider | undefined {
    return providers.get(name);
}

/**
 * Get or create a specific embedding provider with inline validation
 */
export async function getOrCreateEmbeddingProvider(providerName: string): Promise<EmbeddingProvider | null> {
    // Return existing provider if already created and valid
    const existing = providers.get(providerName);
    if (existing) {
        return existing;
    }

    // Create and validate provider on-demand
    try {
        let provider: EmbeddingProvider | null = null;

        switch (providerName) {
            case 'ollama': {
                const baseUrl = await options.getOption('ollamaEmbeddingBaseUrl');
                if (!baseUrl) return null;

                const model = await options.getOption('ollamaEmbeddingModel');
                provider = new OllamaEmbeddingProvider({
                    model,
                    dimension: 768,
                    type: 'float32',
                    baseUrl
                });

                // Validate by initializing (if provider supports it)
                if ('initialize' in provider && typeof provider.initialize === 'function') {
                    await provider.initialize();
                }
                break;
            }

            case 'openai': {
                const apiKey = await options.getOption('openaiApiKey');
                const baseUrl = await options.getOption('openaiBaseUrl');
                if (!apiKey && !baseUrl) return null;

                const model = await options.getOption('openaiEmbeddingModel');
                provider = new OpenAIEmbeddingProvider({
                    model,
                    dimension: 1536,
                    type: 'float32',
                    apiKey: apiKey || '',
                    baseUrl: baseUrl || 'https://api.openai.com/v1'
                });

                if (!apiKey) {
                    log.info('OpenAI embedding provider created without API key for compatible endpoints');
                }
                break;
            }

            case 'voyage': {
                const apiKey = await options.getOption('voyageApiKey' as any);
                if (!apiKey) return null;

                const model = await options.getOption('voyageEmbeddingModel') || 'voyage-2';
                provider = new VoyageEmbeddingProvider({
                    model,
                    dimension: 1024,
                    type: 'float32',
                    apiKey,
                    baseUrl: 'https://api.voyageai.com/v1'
                });
                break;
            }

            case 'local': {
                provider = new SimpleLocalEmbeddingProvider({
                    model: 'local',
                    dimension: 384,
                    type: 'float32'
                });
                break;
            }

            default:
                return null;
        }

        if (provider) {
            registerEmbeddingProvider(provider);
            log.info(`Created and validated ${providerName} embedding provider`);
            return provider;
        }
    } catch (error: any) {
        log.error(`Failed to create ${providerName} embedding provider: ${error.message || 'Unknown error'}`);
    }

    return null;
}

/**
 * Get all enabled embedding providers for the specified feature
 */
export async function getEnabledEmbeddingProviders(feature: 'embeddings' | 'chat' = 'embeddings'): Promise<EmbeddingProvider[]> {
    if (!(await options.getOptionBool('aiEnabled'))) {
        return [];
    }

    const result: EmbeddingProvider[] = [];

    // Get the selected provider for the feature
    const selectedProvider = feature === 'embeddings'
        ? await options.getOption('embeddingSelectedProvider')
        : await options.getOption('aiSelectedProvider');

        // Try to get or create the specific selected provider
        const provider = await getOrCreateEmbeddingProvider(selectedProvider);
        if (!provider) {
            throw new Error(`Failed to create selected embedding provider: ${selectedProvider}. Please check your configuration.`);
        }
        result.push(provider);


    // Always ensure local provider as fallback
    const localProvider = await getOrCreateEmbeddingProvider('local');
    if (localProvider && !result.some(p => p.name === 'local')) {
        result.push(localProvider);
    }

    return result;
}

/**
 * Create a new embedding provider configuration in the database
 */
export async function createEmbeddingProviderConfig(
    name: string,
    config: EmbeddingConfig,
    priority = 0
): Promise<string> {
    const providerId = randomString(16);
    const now = dateUtils.localNowDateTime();
    const utcNow = dateUtils.utcNowDateTime();

    await sql.execute(`
        INSERT INTO embedding_providers
        (providerId, name, priority, config,
         dateCreated, utcDateCreated, dateModified, utcDateModified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [providerId, name, priority, JSON.stringify(config),
            now, utcNow, now, utcNow]
    );

    return providerId;
}

/**
 * Update an existing embedding provider configuration
 */
export async function updateEmbeddingProviderConfig(
    providerId: string,
    priority?: number,
    config?: EmbeddingConfig
): Promise<boolean> {
    const now = dateUtils.localNowDateTime();
    const utcNow = dateUtils.utcNowDateTime();

    // Get existing provider
    const provider = await sql.getRow(
        "SELECT * FROM embedding_providers WHERE providerId = ?",
        [providerId]
    );

    if (!provider) {
        return false;
    }

    // Build update query parts
    const updates: string[] = [];
    const params: any[] = [];

    if (priority !== undefined) {
        updates.push("priority = ?");
        params.push(priority);
    }

    if (config) {
        updates.push("config = ?");
        params.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
        return true; // Nothing to update
    }

    updates.push("dateModified = ?");
    updates.push("utcDateModified = ?");
    params.push(now, utcNow);

    params.push(providerId);

    // Execute update
    await sql.execute(
        `UPDATE embedding_providers SET ${updates.join(", ")} WHERE providerId = ?`,
        params
    );

    return true;
}

/**
 * Delete an embedding provider configuration
 */
export async function deleteEmbeddingProviderConfig(providerId: string): Promise<boolean> {
    const result = await sql.execute(
        "DELETE FROM embedding_providers WHERE providerId = ?",
        [providerId]
    );

    return result.changes > 0;
}

/**
 * Get all embedding provider configurations from the database
 */
export async function getEmbeddingProviderConfigs() {
    return await sql.getRows("SELECT * FROM embedding_providers ORDER BY priority DESC");
}

export default {
    registerEmbeddingProvider,
    unregisterEmbeddingProvider,
    clearAllEmbeddingProviders,
    getEmbeddingProviders,
    getEmbeddingProvider,
    getEnabledEmbeddingProviders,
    getOrCreateEmbeddingProvider,
    createEmbeddingProviderConfig,
    updateEmbeddingProviderConfig,
    deleteEmbeddingProviderConfig,
    getEmbeddingProviderConfigs
};

/**
 * Get OpenAI provider options from chat options and configuration
 * Updated to use provider metadata approach
 */
export function getOpenAIOptions(
    opts: ChatCompletionOptions = {}
): OpenAIOptions {
    try {
        const apiKey = options.getOption('openaiApiKey');
        if (!apiKey) {
            // Log warning but don't throw - some OpenAI-compatible endpoints don't require API keys
            log.info('OpenAI API key is not configured. This may cause issues with official OpenAI endpoints.');
        }

        const baseUrl = options.getOption('openaiBaseUrl') || PROVIDER_CONSTANTS.OPENAI.BASE_URL;
        const modelName = opts.model || options.getOption('openaiDefaultModel') || PROVIDER_CONSTANTS.OPENAI.DEFAULT_MODEL;

        // Create provider metadata
        const providerMetadata: ModelMetadata = {
            provider: 'openai',
            modelId: modelName,
            displayName: modelName,
            capabilities: {
                supportsTools: modelName.includes('gpt-4') || modelName.includes('gpt-3.5-turbo'),
                supportsVision: modelName.includes('vision') || modelName.includes('gpt-4-turbo') || modelName.includes('gpt-4o'),
                supportsStreaming: true
            }
        };

        // Get temperature from options or global setting
        const temperature = opts.temperature !== undefined
            ? opts.temperature
            : parseFloat(options.getOption('aiTemperature') || String(SEARCH_CONSTANTS.TEMPERATURE.DEFAULT));

        return {
            // Connection settings
            apiKey: apiKey || '', // Default to empty string if no API key
            baseUrl,

            // Provider metadata
            providerMetadata,

            // API parameters
            model: modelName,
            temperature,
            max_tokens: opts.maxTokens,
            stream: opts.stream,
            top_p: opts.topP,
            frequency_penalty: opts.frequencyPenalty,
            presence_penalty: opts.presencePenalty,
            tools: opts.tools,

            // Internal configuration
            systemPrompt: opts.systemPrompt,
            enableTools: opts.enableTools,
        };
    } catch (error) {
        log.error(`Error creating OpenAI provider options: ${error}`);
        throw error;
    }
}

/**
 * Get Anthropic provider options from chat options and configuration
 * Updated to use provider metadata approach
 */
export function getAnthropicOptions(
    opts: ChatCompletionOptions = {}
): AnthropicOptions {
    try {
        const apiKey = options.getOption('anthropicApiKey');
        if (!apiKey) {
            throw new Error('Anthropic API key is not configured');
        }

        const baseUrl = options.getOption('anthropicBaseUrl') || PROVIDER_CONSTANTS.ANTHROPIC.BASE_URL;
        const modelName = opts.model || options.getOption('anthropicDefaultModel') || PROVIDER_CONSTANTS.ANTHROPIC.DEFAULT_MODEL;

        // Create provider metadata
        const providerMetadata: ModelMetadata = {
            provider: 'anthropic',
            modelId: modelName,
            displayName: modelName,
            capabilities: {
                supportsTools: modelName.includes('claude-3') || modelName.includes('claude-3.5'),
                supportsVision: modelName.includes('claude-3') || modelName.includes('claude-3.5'),
                supportsStreaming: true,
                // Anthropic models typically have large context windows
                contextWindow: modelName.includes('claude-3-opus') ? 200000 :
                    modelName.includes('claude-3-sonnet') ? 180000 :
                        modelName.includes('claude-3.5-sonnet') ? 200000 : 100000
            }
        };

        // Get temperature from options or global setting
        const temperature = opts.temperature !== undefined
            ? opts.temperature
            : parseFloat(options.getOption('aiTemperature') || String(SEARCH_CONSTANTS.TEMPERATURE.DEFAULT));

        return {
            // Connection settings
            apiKey,
            baseUrl,
            apiVersion: PROVIDER_CONSTANTS.ANTHROPIC.API_VERSION,
            betaVersion: PROVIDER_CONSTANTS.ANTHROPIC.BETA_VERSION,

            // Provider metadata
            providerMetadata,

            // API parameters
            model: modelName,
            temperature,
            max_tokens: opts.maxTokens,
            stream: opts.stream,
            top_p: opts.topP,

            // Internal configuration
            systemPrompt: opts.systemPrompt
        };
    } catch (error) {
        log.error(`Error creating Anthropic provider options: ${error}`);
        throw error;
    }
}

/**
 * Get Ollama provider options from chat options and configuration
 * This implementation cleanly separates provider information from model names
 */
export async function getOllamaOptions(
    opts: ChatCompletionOptions = {},
    contextWindow?: number
): Promise<OllamaOptions> {
    try {
        const baseUrl = options.getOption('ollamaBaseUrl');
        if (!baseUrl) {
            throw new Error('Ollama API URL is not configured');
        }

        // Get the model name - no prefix handling needed now
        let modelName = opts.model || options.getOption('ollamaDefaultModel') || 'llama3';

        // Create provider metadata
        const providerMetadata: ModelMetadata = {
            provider: 'ollama',
            modelId: modelName,
            capabilities: {
                supportsTools: true,
                supportsStreaming: true
            }
        };

        // Get temperature from options or global setting
        const temperature = opts.temperature !== undefined
            ? opts.temperature
            : parseFloat(options.getOption('aiTemperature') || String(SEARCH_CONSTANTS.TEMPERATURE.DEFAULT));

        // Use provided context window or get from model if not specified
        const modelContextWindow = contextWindow || await getOllamaModelContextWindow(modelName);

        // Update capabilities with context window information
        providerMetadata.capabilities!.contextWindow = modelContextWindow;

        return {
            // Connection settings
            baseUrl,

            // Provider metadata
            providerMetadata,

            // API parameters
            model: modelName,  // Clean model name without provider prefix
            stream: opts.stream !== undefined ? opts.stream : true, // Default to true if not specified
            options: {
                temperature: opts.temperature,
                num_ctx: modelContextWindow,
                num_predict: opts.maxTokens,
                response_format: opts.expectsJsonResponse ? { type: "json_object" } : undefined
            },
            tools: opts.tools,

            // Internal configuration
            systemPrompt: opts.systemPrompt,
            enableTools: opts.enableTools,
            bypassFormatter: opts.bypassFormatter,
            preserveSystemPrompt: opts.preserveSystemPrompt,
            expectsJsonResponse: opts.expectsJsonResponse,
            toolExecutionStatus: opts.toolExecutionStatus,
        };
    } catch (error) {
        log.error(`Error creating Ollama provider options: ${error}`);
        throw error;
    }
}

/**
 * Get context window size for Ollama model using the official client
 */
async function getOllamaModelContextWindow(modelName: string): Promise<number> {
    try {
        const baseUrl = options.getOption('ollamaBaseUrl');

        if (!baseUrl) {
            throw new Error('Ollama base URL is not configured');
        }

        // Use the official Ollama client
        const { Ollama } = await import('ollama');
        const client = new Ollama({ host: baseUrl });

        // Try to get model information from Ollama API
        const modelData = await client.show({ model: modelName });

        // Get context window from model parameters
        if (modelData && modelData.parameters) {
            const params = modelData.parameters as any;
            if (params.num_ctx) {
                return params.num_ctx;
            }
        }

        // Default context sizes by model family if we couldn't get specific info
        if (modelName.includes('llama3')) {
            return MODEL_CAPABILITIES['gpt-4'].contextWindowTokens;
        } else if (modelName.includes('llama2')) {
            return MODEL_CAPABILITIES['default'].contextWindowTokens;
        } else if (modelName.includes('mistral') || modelName.includes('mixtral')) {
            return MODEL_CAPABILITIES['gpt-4'].contextWindowTokens;
        } else if (modelName.includes('gemma')) {
            return MODEL_CAPABILITIES['gpt-4'].contextWindowTokens;
        }

        // Return a reasonable default
        return MODEL_CAPABILITIES['default'].contextWindowTokens;
    } catch (error) {
        log.info(`Error getting context window for model ${modelName}: ${error}`);
        return MODEL_CAPABILITIES['default'].contextWindowTokens; // Default fallback
    }
}
