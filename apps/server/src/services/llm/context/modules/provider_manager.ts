import log from '../../../log.js';

/**
 * Manages embedding providers for context services
 * Simplified since embedding functionality has been removed
 */
export class ProviderManager {
    /**
     * Get the selected embedding provider based on user settings
     * Returns null since embeddings have been removed
     */
    async getSelectedEmbeddingProvider(): Promise<null> {
        log.info('Embedding providers have been removed - returning null');
        return null;
    }

    /**
     * Get all enabled embedding providers
     * Returns empty array since embeddings have been removed
     */
    async getEnabledEmbeddingProviders(): Promise<never[]> {
        log.info('Embedding providers have been removed - returning empty array');
        return [];
    }

    /**
     * Check if embedding providers are available
     * Returns false since embeddings have been removed
     */
    isEmbeddingAvailable(): boolean {
        return false;
    }
}

// Export singleton instance
export const providerManager = new ProviderManager();
export default providerManager;