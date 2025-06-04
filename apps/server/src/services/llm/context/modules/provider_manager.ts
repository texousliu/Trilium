import log from '../../../log.js';
import { getEmbeddingProvider, getEnabledEmbeddingProviders } from '../../providers/providers.js';
import { getSelectedEmbeddingProvider } from '../../config/configuration_helpers.js';

/**
 * Manages embedding providers for context services
 */
export class ProviderManager {
    /**
     * Get the selected embedding provider based on user settings
     * Uses the single provider selection approach
     *
     * @returns The selected embedding provider or null if none available
     */
    async getPreferredEmbeddingProvider(): Promise<any> {
        try {
            // Get the selected embedding provider
            const selectedProvider = await getSelectedEmbeddingProvider();
            
            if (selectedProvider) {
                const provider = await getEmbeddingProvider(selectedProvider);
                if (provider) {
                    log.info(`Using selected embedding provider: ${selectedProvider}`);
                    return provider;
                }
                log.info(`Selected embedding provider ${selectedProvider} is not available`);
            }

            // If no provider is selected or available, try any enabled provider
            const providers = await getEnabledEmbeddingProviders();
            if (providers.length > 0) {
                log.info(`Using available embedding provider: ${providers[0].name}`);
                return providers[0];
            }

            // Last resort is local provider
            log.info('Using local embedding provider as fallback');
            return await getEmbeddingProvider('local');
        } catch (error) {
            log.error(`Error getting preferred embedding provider: ${error}`);
            return null;
        }
    }

    /**
     * Generate embeddings for a text query
     *
     * @param query - The text query to embed
     * @returns The generated embedding or null if failed
     */
    async generateQueryEmbedding(query: string): Promise<Float32Array | null> {
        try {
            // Get the preferred embedding provider
            const provider = await this.getPreferredEmbeddingProvider();
            if (!provider) {
                log.error('No embedding provider available');
                return null;
            }

            // Generate the embedding
            const embedding = await provider.generateEmbeddings(query);

            if (embedding) {
                // Add the original query as a property to the embedding
                // This is used for title matching in the vector search
                Object.defineProperty(embedding, 'originalQuery', {
                    value: query,
                    writable: false,
                    enumerable: true,
                    configurable: false
                });
            }

            return embedding;
        } catch (error) {
            log.error(`Error generating query embedding: ${error}`);
            return null;
        }
    }
}

// Export singleton instance
export default new ProviderManager();
