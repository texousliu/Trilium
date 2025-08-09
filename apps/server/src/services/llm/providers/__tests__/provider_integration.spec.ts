/**
 * Provider Integration Tests
 * 
 * Integration tests for provider factory with AI Service Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProviderFactory, ProviderType } from '../provider_factory.js';
import { 
    MockProviderFactory, 
    MockProvider,
    createMockProvider,
    createMockStream 
} from './mock_providers.js';
import type { AIService, ChatCompletionOptions } from '../../ai_interface.js';
import {
    UnifiedStreamChunk,
    StreamAggregator,
    createStreamHandler
} from '../unified_stream_handler.js';

// Mock the actual provider imports
vi.mock('../openai_service.js', () => ({
    OpenAIService: vi.fn()
}));
vi.mock('../anthropic_service.js', () => ({
    AnthropicService: vi.fn()
}));
vi.mock('../ollama_service.js', () => ({
    OllamaService: vi.fn()
}));

// Import mocked modules
import { OpenAIService } from '../openai_service.js';
import { AnthropicService } from '../anthropic_service.js';
import { OllamaService } from '../ollama_service.js';

describe('Provider Factory Integration', () => {
    let factory: ProviderFactory;
    let mockFactory: MockProviderFactory;

    beforeEach(() => {
        // Clear singleton
        const existing = ProviderFactory.getInstance();
        if (existing) {
            existing.dispose();
        }

        factory = new ProviderFactory({
            enableHealthChecks: false,
            enableMetrics: true,
            cacheTimeout: 5000
        });

        mockFactory = new MockProviderFactory();
    });

    afterEach(() => {
        factory.dispose();
        mockFactory.disposeAll();
        vi.clearAllMocks();
    });

    describe('Multi-Provider Management', () => {
        it('should manage multiple providers simultaneously', async () => {
            // Setup mock providers
            const openaiMock = mockFactory.createProvider('openai');
            const anthropicMock = mockFactory.createProvider('anthropic');
            const ollamaMock = mockFactory.createProvider('ollama');

            (OpenAIService as any).mockImplementation(() => openaiMock);
            (AnthropicService as any).mockImplementation(() => anthropicMock);
            (OllamaService as any).mockImplementation(() => ollamaMock);

            // Create providers
            const openai = await factory.createProvider(ProviderType.OPENAI);
            const anthropic = await factory.createProvider(ProviderType.ANTHROPIC);
            const ollama = await factory.createProvider(ProviderType.OLLAMA);

            // Test all are available
            expect(openai.isAvailable()).toBe(true);
            expect(anthropic.isAvailable()).toBe(true);
            expect(ollama.isAvailable()).toBe(true);

            // Test statistics
            const stats = factory.getStatistics();
            expect(stats.cachedProviders).toBe(3);
        });

        it('should handle provider-specific configurations', async () => {
            const customConfig = {
                baseUrl: 'https://custom.api.endpoint',
                timeout: 30000
            };

            const mock = mockFactory.createProvider('openai');
            (OpenAIService as any).mockImplementation(() => mock);

            const provider1 = await factory.createProvider(ProviderType.OPENAI, customConfig);
            const provider2 = await factory.createProvider(ProviderType.OPENAI); // Different config

            // Should create two separate instances
            const stats = factory.getStatistics();
            expect(stats.cachedProviders).toBe(2);
        });
    });

    describe('Fallback Scenarios', () => {
        it('should fallback through provider chain on failures', async () => {
            const failingFactory = new ProviderFactory({
                enableHealthChecks: false,
                enableFallback: true,
                fallbackProviders: [ProviderType.ANTHROPIC, ProviderType.OLLAMA],
                enableCaching: false
            });

            // OpenAI fails
            (OpenAIService as any).mockImplementation(() => {
                throw new Error('OpenAI unavailable');
            });

            // Anthropic fails
            (AnthropicService as any).mockImplementation(() => {
                throw new Error('Anthropic unavailable');
            });

            // Ollama succeeds
            const ollamaMock = mockFactory.createProvider('ollama');
            (OllamaService as any).mockImplementation(() => ollamaMock);

            const provider = await failingFactory.createProvider(ProviderType.OPENAI);
            
            expect(provider).toBeDefined();
            expect(provider.isAvailable()).toBe(true);
            expect(OllamaService).toHaveBeenCalled();

            failingFactory.dispose();
        });

        it('should handle complete fallback failure', async () => {
            const failingFactory = new ProviderFactory({
                enableHealthChecks: false,
                enableFallback: true,
                fallbackProviders: [ProviderType.ANTHROPIC],
                enableCaching: false
            });

            // All providers fail
            (OpenAIService as any).mockImplementation(() => {
                throw new Error('OpenAI unavailable');
            });
            (AnthropicService as any).mockImplementation(() => {
                throw new Error('Anthropic unavailable');
            });

            await expect(failingFactory.createProvider(ProviderType.OPENAI))
                .rejects.toThrow('OpenAI unavailable');

            failingFactory.dispose();
        });
    });

    describe('Health Monitoring', () => {
        it('should perform health checks across all providers', async () => {
            // Setup healthy providers
            const openaiMock = createMockProvider('success');
            const anthropicMock = createMockProvider('success');
            const ollamaMock = createMockProvider('success');

            (OpenAIService as any).mockImplementation(() => openaiMock);
            (AnthropicService as any).mockImplementation(() => anthropicMock);
            (OllamaService as any).mockImplementation(() => ollamaMock);

            // Perform health checks
            const openaiHealth = await factory.checkProviderHealth(ProviderType.OPENAI);
            const anthropicHealth = await factory.checkProviderHealth(ProviderType.ANTHROPIC);
            const ollamaHealth = await factory.checkProviderHealth(ProviderType.OLLAMA);

            expect(openaiHealth.healthy).toBe(true);
            expect(anthropicHealth.healthy).toBe(true);
            expect(ollamaHealth.healthy).toBe(true);

            // Check all statuses
            const allStatuses = factory.getAllHealthStatuses();
            expect(allStatuses.size).toBe(3);
        });

        it('should detect unhealthy providers', async () => {
            const errorMock = createMockProvider('error');
            (OpenAIService as any).mockImplementation(() => errorMock);

            const health = await factory.checkProviderHealth(ProviderType.OPENAI);
            
            expect(health.healthy).toBe(false);
            expect(health.error).toBeDefined();
        });

        it('should measure provider latency', async () => {
            const slowMock = createMockProvider('slow');
            slowMock.setResponseDelay(100);
            (OpenAIService as any).mockImplementation(() => slowMock);

            const health = await factory.checkProviderHealth(ProviderType.OPENAI);
            
            expect(health.latency).toBeGreaterThan(100);
        });
    });

    describe('Streaming Integration', () => {
        it('should handle streaming across providers', async () => {
            const mock = mockFactory.createProvider('openai');
            (OpenAIService as any).mockImplementation(() => mock);

            const provider = await factory.createProvider(ProviderType.OPENAI);
            
            const messages = [{ role: 'user' as const, content: 'Hello' }];
            const chunks: string[] = [];
            
            const response = await provider.generateChatCompletion(messages, {
                stream: true,
                streamCallback: async (chunk, isDone) => {
                    if (!isDone) {
                        chunks.push(chunk);
                    }
                }
            });

            expect(chunks.length).toBeGreaterThan(0);
            expect(response.text).toBe(chunks.join(''));
        });

        it('should unify streaming formats', async () => {
            const aggregator = new StreamAggregator();
            
            // Test OpenAI format
            const openaiHandler = createStreamHandler({
                provider: 'openai',
                onChunk: (chunk) => aggregator.addChunk(chunk)
            });

            await openaiHandler.processChunk({
                choices: [{
                    delta: { content: 'Hello from OpenAI' }
                }]
            });

            // Test Anthropic format
            aggregator.reset();
            const anthropicHandler = createStreamHandler({
                provider: 'anthropic',
                onChunk: (chunk) => aggregator.addChunk(chunk)
            });

            await anthropicHandler.processChunk(
                'event: content_block_delta\ndata: {"delta":{"type":"text_delta","text":"Hello from Anthropic"}}'
            );

            // Test Ollama format
            aggregator.reset();
            const ollamaHandler = createStreamHandler({
                provider: 'ollama',
                onChunk: (chunk) => aggregator.addChunk(chunk)
            });

            await ollamaHandler.processChunk({
                message: { content: 'Hello from Ollama' },
                done: false
            });

            // All should produce similar unified format
            const response = aggregator.getResponse();
            expect(response.text).toContain('Hello from Ollama');
        });
    });

    describe('Performance and Caching', () => {
        it('should cache providers efficiently', async () => {
            const mock = mockFactory.createProvider('openai');
            (OpenAIService as any).mockImplementation(() => mock);

            const startTime = Date.now();
            
            // First call - creates provider
            await factory.createProvider(ProviderType.OPENAI);
            const firstCallTime = Date.now() - startTime;
            
            // Second call - uses cache
            const cachedStartTime = Date.now();
            await factory.createProvider(ProviderType.OPENAI);
            const cachedCallTime = Date.now() - cachedStartTime;
            
            // Cached call should be much faster
            expect(cachedCallTime).toBeLessThan(firstCallTime);
            expect(OpenAIService).toHaveBeenCalledTimes(1);
        });

        it('should track usage statistics', async () => {
            const mock = mockFactory.createProvider('openai');
            (OpenAIService as any).mockImplementation(() => mock);

            // Create and use provider multiple times
            for (let i = 0; i < 5; i++) {
                await factory.createProvider(ProviderType.OPENAI);
            }

            const stats = factory.getStatistics();
            expect(stats.totalUsage).toBe(5);
            expect(stats.providerUsage['openai']).toBe(5);
        });

        it('should cleanup expired cache automatically', async () => {
            const shortCacheFactory = new ProviderFactory({
                enableHealthChecks: false,
                cacheTimeout: 100
            });

            const mock = mockFactory.createProvider('openai');
            (OpenAIService as any).mockImplementation(() => mock);

            await shortCacheFactory.createProvider(ProviderType.OPENAI);
            
            let stats = shortCacheFactory.getStatistics();
            expect(stats.cachedProviders).toBe(1);

            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 150));
            
            shortCacheFactory.cleanupExpiredCache();
            
            stats = shortCacheFactory.getStatistics();
            expect(stats.cachedProviders).toBe(0);

            shortCacheFactory.dispose();
        });
    });

    describe('Error Recovery', () => {
        it('should recover from transient errors', async () => {
            const flakyMock = createMockProvider('flaky');
            (OpenAIService as any).mockImplementation(() => flakyMock);

            const provider = await factory.createProvider(ProviderType.OPENAI);
            
            let successCount = 0;
            let errorCount = 0;
            
            // Try multiple requests
            for (let i = 0; i < 10; i++) {
                try {
                    await provider.generateChatCompletion([
                        { role: 'user', content: 'Test' }
                    ]);
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }

            // Should have some successes and some failures
            expect(successCount).toBeGreaterThan(0);
            expect(errorCount).toBeGreaterThan(0);
        });

        it('should handle provider disposal gracefully', async () => {
            const mock = mockFactory.createProvider('openai');
            mock.dispose = vi.fn();
            
            (OpenAIService as any).mockImplementation(() => mock);

            await factory.createProvider(ProviderType.OPENAI);
            
            factory.clearCache();
            
            expect(mock.dispose).toHaveBeenCalled();
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent provider creation', async () => {
            const mock = mockFactory.createProvider('openai');
            (OpenAIService as any).mockImplementation(() => mock);

            // Create multiple providers concurrently
            const promises = Array(10).fill(null).map(() => 
                factory.createProvider(ProviderType.OPENAI)
            );

            const providers = await Promise.all(promises);
            
            // All should get the same cached instance
            const firstProvider = providers[0];
            expect(providers.every(p => p === firstProvider)).toBe(true);
            
            // Constructor should only be called once
            expect(OpenAIService).toHaveBeenCalledTimes(1);
        });

        it('should handle concurrent health checks', async () => {
            const openaiMock = createMockProvider('success');
            const anthropicMock = createMockProvider('success');
            const ollamaMock = createMockProvider('success');

            (OpenAIService as any).mockImplementation(() => openaiMock);
            (AnthropicService as any).mockImplementation(() => anthropicMock);
            (OllamaService as any).mockImplementation(() => ollamaMock);

            // Perform health checks concurrently
            const healthChecks = await Promise.all([
                factory.checkProviderHealth(ProviderType.OPENAI),
                factory.checkProviderHealth(ProviderType.ANTHROPIC),
                factory.checkProviderHealth(ProviderType.OLLAMA)
            ]);

            expect(healthChecks).toHaveLength(3);
            expect(healthChecks.every(h => h.healthy)).toBe(true);
        });
    });
});