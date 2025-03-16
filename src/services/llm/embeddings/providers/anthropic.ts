import axios from "axios";
import log from "../../../log.js";
import { BaseEmbeddingProvider } from "../base_embeddings.js";
import type { EmbeddingConfig, EmbeddingModelInfo } from "../embeddings_interface.js";
import { LLM_CONSTANTS } from "../../../../routes/api/llm.js";

// Anthropic model context window sizes - as of current API version
const ANTHROPIC_MODEL_CONTEXT_WINDOWS: Record<string, number> = {
    "claude-3-opus-20240229": 200000,
    "claude-3-sonnet-20240229": 180000,
    "claude-3-haiku-20240307": 48000,
    "claude-2.1": 200000,
    "claude-2.0": 100000,
    "claude-instant-1.2": 100000,
    "default": 100000
};

/**
 * Anthropic embedding provider implementation
 */
export class AnthropicEmbeddingProvider extends BaseEmbeddingProvider {
    name = "anthropic";

    constructor(config: EmbeddingConfig) {
        super(config);
    }

    /**
     * Initialize the provider by detecting model capabilities
     */
    async initialize(): Promise<void> {
        const modelName = this.config.model || "claude-3-haiku-20240307";
        try {
            // Detect model capabilities
            const modelInfo = await this.getModelInfo(modelName);

            // Update the config dimension
            this.config.dimension = modelInfo.dimension;

            log.info(`Anthropic model ${modelName} initialized with dimension ${this.config.dimension} and context window ${modelInfo.contextWindow}`);
        } catch (error: any) {
            log.error(`Error initializing Anthropic provider: ${error.message}`);
        }
    }

    /**
     * Try to determine Anthropic model capabilities
     * Note: Anthropic doesn't have a public endpoint for model metadata, so we use a combination
     * of known values and detection by test embeddings
     */
    private async fetchModelCapabilities(modelName: string): Promise<EmbeddingModelInfo | null> {
        // Anthropic doesn't have a model info endpoint, but we can look up known context sizes
        // and detect embedding dimensions by making a test request

        try {
            // Get context window size from our local registry of known models
            const modelBase = Object.keys(ANTHROPIC_MODEL_CONTEXT_WINDOWS).find(
                model => modelName.startsWith(model)
            ) || "default";

            const contextWindow = ANTHROPIC_MODEL_CONTEXT_WINDOWS[modelBase];

            // For embedding dimension, we'll return null and let getModelInfo detect it
            return {
                dimension: 0, // Will be detected by test embedding
                contextWindow
            };
        } catch (error) {
            log.info(`Could not determine capabilities for Anthropic model ${modelName}: ${error}`);
            return null;
        }
    }

    /**
     * Get model information including embedding dimensions
     */
    async getModelInfo(modelName: string): Promise<EmbeddingModelInfo> {
        // Check cache first
        if (this.modelInfoCache.has(modelName)) {
            return this.modelInfoCache.get(modelName);
        }

        // Try to determine model capabilities
        const capabilities = await this.fetchModelCapabilities(modelName);
        const contextWindow = capabilities?.contextWindow || LLM_CONSTANTS.CONTEXT_WINDOW.ANTHROPIC;

        // For Anthropic, we need to detect embedding dimension with a test call
        try {
            // Detect dimension with a test embedding
            const testEmbedding = await this.generateEmbeddings("Test");
            const dimension = testEmbedding.length;

            const modelInfo: EmbeddingModelInfo = {
                dimension,
                contextWindow
            };

            this.modelInfoCache.set(modelName, modelInfo);
            this.config.dimension = dimension;

            log.info(`Detected Anthropic model ${modelName} with dimension ${dimension} (context: ${contextWindow})`);
            return modelInfo;
        } catch (error: any) {
            // If detection fails, use defaults
            const dimension = LLM_CONSTANTS.EMBEDDING_DIMENSIONS.ANTHROPIC.DEFAULT;

            log.info(`Using default parameters for Anthropic model ${modelName}: dimension ${dimension}, context ${contextWindow}`);

            const modelInfo: EmbeddingModelInfo = { dimension, contextWindow };
            this.modelInfoCache.set(modelName, modelInfo);
            this.config.dimension = dimension;

            return modelInfo;
        }
    }

    /**
     * Generate embeddings for a single text
     */
    async generateEmbeddings(text: string): Promise<Float32Array> {
        try {
            if (!text.trim()) {
                return new Float32Array(this.config.dimension);
            }

            // Get model info to check context window
            const modelName = this.config.model || "claude-3-haiku-20240307";
            const modelInfo = await this.getModelInfo(modelName);

            // Trim text if it might exceed context window (rough character estimate)
            const charLimit = modelInfo.contextWindow * 4; // Rough estimate: avg 4 chars per token
            const trimmedText = text.length > charLimit ? text.substring(0, charLimit) : text;

            const response = await axios.post(
                `${this.baseUrl}/embeddings`,
                {
                    model: modelName,
                    input: trimmedText,
                    encoding_format: "float"
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": this.apiKey,
                        "anthropic-version": "2023-06-01"
                    }
                }
            );

            if (response.data && response.data.embedding) {
                return new Float32Array(response.data.embedding);
            } else {
                throw new Error("Unexpected response structure from Anthropic API");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error";
            log.error(`Anthropic embedding error: ${errorMessage}`);
            throw new Error(`Anthropic embedding error: ${errorMessage}`);
        }
    }

    /**
     * More specific implementation of batch size error detection for Anthropic
     */
    protected isBatchSizeError(error: any): boolean {
        const errorMessage = error?.message || error?.response?.data?.error?.message || '';
        const anthropicBatchSizeErrorPatterns = [
            'batch size', 'too many inputs', 'context length exceeded',
            'token limit', 'rate limit', 'limit exceeded',
            'too long', 'request too large', 'content too large'
        ];

        return anthropicBatchSizeErrorPatterns.some(pattern =>
            errorMessage.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    /**
     * Generate embeddings for multiple texts in a single batch
     *
     * Note: Anthropic doesn't currently support batch embedding, so we process each text individually
     * but using the adaptive batch processor to handle errors and retries
     */
    async generateBatchEmbeddings(texts: string[]): Promise<Float32Array[]> {
        if (texts.length === 0) {
            return [];
        }

        try {
            return await this.processWithAdaptiveBatch(
                texts,
                async (batch) => {
                    const results: Float32Array[] = [];

                    // For Anthropic, we have to process one at a time
                    for (const text of batch) {
                        // Skip empty texts
                        if (!text.trim()) {
                            results.push(new Float32Array(this.config.dimension));
                            continue;
                        }

                        const embedding = await this.generateEmbeddings(text);
                        results.push(embedding);
                    }

                    return results;
                },
                this.isBatchSizeError
            );
        }
        catch (error: any) {
            const errorMessage = error.message || "Unknown error";
            log.error(`Anthropic batch embedding error: ${errorMessage}`);
            throw new Error(`Anthropic batch embedding error: ${errorMessage}`);
        }
    }
}
