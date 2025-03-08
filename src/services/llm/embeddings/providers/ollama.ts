import { BaseEmbeddingProvider } from "../base_embeddings.js";
import type { EmbeddingConfig } from "../embeddings_interface.js";
import axios from "axios";
import log from "../../../log.js";

interface OllamaEmbeddingConfig extends EmbeddingConfig {
    baseUrl: string;
}

/**
 * Ollama embedding provider implementation
 */
export class OllamaEmbeddingProvider extends BaseEmbeddingProvider {
    name = "ollama";
    private baseUrl: string;

    constructor(config: OllamaEmbeddingConfig) {
        super(config);
        this.baseUrl = config.baseUrl;
    }

    /**
     * Generate embeddings for a single text
     */
    async generateEmbeddings(text: string): Promise<Float32Array> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/api/embeddings`,
                {
                    model: this.config.model || "llama3",
                    prompt: text
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data && Array.isArray(response.data.embedding)) {
                return new Float32Array(response.data.embedding);
            } else {
                throw new Error("Unexpected response structure from Ollama API");
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error";
            log.error(`Ollama embedding error: ${errorMessage}`);
            throw new Error(`Ollama embedding error: ${errorMessage}`);
        }
    }

    /**
     * Generate embeddings for multiple texts
     *
     * Note: Ollama API doesn't support batch embedding, so we process them sequentially
     */
    async generateBatchEmbeddings(texts: string[]): Promise<Float32Array[]> {
        if (texts.length === 0) {
            return [];
        }

        const results: Float32Array[] = [];

        for (const text of texts) {
            try {
                const embedding = await this.generateEmbeddings(text);
                results.push(embedding);
            } catch (error: any) {
                const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error";
                log.error(`Ollama batch embedding error: ${errorMessage}`);
                throw new Error(`Ollama batch embedding error: ${errorMessage}`);
            }
        }

        return results;
    }
}
