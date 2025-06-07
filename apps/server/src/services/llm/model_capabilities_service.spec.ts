import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModelCapabilitiesService } from './model_capabilities_service.js';
import type { ModelCapabilities } from './interfaces/model_capabilities.js';

// Mock dependencies
vi.mock('../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

vi.mock('./interfaces/model_capabilities.js', () => ({
    DEFAULT_MODEL_CAPABILITIES: {
        contextLength: 4096,
        supportedMessageTypes: ['text'],
        supportsToolCalls: false,
        supportsStreaming: true,
        maxOutputTokens: 2048,
        temperature: { min: 0, max: 2, default: 0.7 },
        topP: { min: 0, max: 1, default: 0.9 }
    }
}));

vi.mock('./constants/search_constants.js', () => ({
    MODEL_CAPABILITIES: {
        'gpt-4': {
            contextLength: 8192,
            supportsToolCalls: true,
            maxOutputTokens: 4096
        },
        'gpt-3.5-turbo': {
            contextLength: 4096,
            supportsToolCalls: true,
            maxOutputTokens: 2048
        },
        'claude-3-opus': {
            contextLength: 200000,
            supportsToolCalls: true,
            maxOutputTokens: 4096
        }
    }
}));

vi.mock('./ai_service_manager.js', () => ({
    default: {
        getService: vi.fn()
    }
}));

describe('ModelCapabilitiesService', () => {
    let service: ModelCapabilitiesService;
    let mockLog: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        service = new ModelCapabilitiesService();
        
        // Get mocked log
        mockLog = (await import('../log.js')).default;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        service.clearCache();
    });

    describe('getChatModelCapabilities', () => {
        it('should return cached capabilities if available', async () => {
            const mockCapabilities: ModelCapabilities = {
                contextLength: 8192,
                supportedMessageTypes: ['text'],
                supportsToolCalls: true,
                supportsStreaming: true,
                maxOutputTokens: 4096,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            };

            // Pre-populate cache
            (service as any).capabilitiesCache.set('chat:gpt-4', mockCapabilities);

            const result = await service.getChatModelCapabilities('gpt-4');

            expect(result).toEqual(mockCapabilities);
            expect(mockLog.info).not.toHaveBeenCalled();
        });

        it('should fetch and cache capabilities for new model', async () => {
            const result = await service.getChatModelCapabilities('gpt-4');

            expect(result).toEqual({
                contextLength: 8192,
                supportedMessageTypes: ['text'],
                supportsToolCalls: true,
                supportsStreaming: true,
                maxOutputTokens: 4096,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            });

            expect(mockLog.info).toHaveBeenCalledWith('Using static capabilities for chat model: gpt-4');

            // Verify it's cached
            const cached = (service as any).capabilitiesCache.get('chat:gpt-4');
            expect(cached).toEqual(result);
        });

        it('should handle case-insensitive model names', async () => {
            const result = await service.getChatModelCapabilities('GPT-4');

            expect(result.contextLength).toBe(8192);
            expect(result.supportsToolCalls).toBe(true);
            expect(mockLog.info).toHaveBeenCalledWith('Using static capabilities for chat model: GPT-4');
        });

        it('should return default capabilities for unknown models', async () => {
            const result = await service.getChatModelCapabilities('unknown-model');

            expect(result).toEqual({
                contextLength: 4096,
                supportedMessageTypes: ['text'],
                supportsToolCalls: false,
                supportsStreaming: true,
                maxOutputTokens: 2048,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            });

            expect(mockLog.info).toHaveBeenCalledWith('AI service doesn\'t support model capabilities - using defaults for model: unknown-model');
        });

        it('should merge static capabilities with defaults', async () => {
            const result = await service.getChatModelCapabilities('gpt-3.5-turbo');

            expect(result).toEqual({
                contextLength: 4096,
                supportedMessageTypes: ['text'],
                supportsToolCalls: true,
                supportsStreaming: true,
                maxOutputTokens: 2048,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            });
        });

    });

    describe('clearCache', () => {
        it('should clear all cached capabilities', () => {
            const mockCapabilities: ModelCapabilities = {
                contextLength: 8192,
                supportedMessageTypes: ['text'],
                supportsToolCalls: true,
                supportsStreaming: true,
                maxOutputTokens: 4096,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            };

            // Pre-populate cache
            (service as any).capabilitiesCache.set('chat:model1', mockCapabilities);
            (service as any).capabilitiesCache.set('chat:model2', mockCapabilities);

            expect((service as any).capabilitiesCache.size).toBe(2);

            service.clearCache();

            expect((service as any).capabilitiesCache.size).toBe(0);
            expect(mockLog.info).toHaveBeenCalledWith('Model capabilities cache cleared');
        });
    });

    describe('getCachedCapabilities', () => {
        it('should return all cached capabilities as a record', () => {
            const mockCapabilities1: ModelCapabilities = {
                contextLength: 8192,
                supportedMessageTypes: ['text'],
                supportsToolCalls: true,
                supportsStreaming: true,
                maxOutputTokens: 4096,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            };

            const mockCapabilities2: ModelCapabilities = {
                contextLength: 4096,
                supportedMessageTypes: ['text'],
                supportsToolCalls: false,
                supportsStreaming: true,
                maxOutputTokens: 2048,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            };

            // Pre-populate cache
            (service as any).capabilitiesCache.set('chat:model1', mockCapabilities1);
            (service as any).capabilitiesCache.set('chat:model2', mockCapabilities2);

            const result = service.getCachedCapabilities();

            expect(result).toEqual({
                'chat:model1': mockCapabilities1,
                'chat:model2': mockCapabilities2
            });
        });

        it('should return empty object when cache is empty', () => {
            const result = service.getCachedCapabilities();

            expect(result).toEqual({});
        });
    });

    describe('fetchChatModelCapabilities', () => {
        it('should return static capabilities when available', async () => {
            // Access private method for testing
            const fetchMethod = (service as any).fetchChatModelCapabilities.bind(service);
            const result = await fetchMethod('claude-3-opus');

            expect(result).toEqual({
                contextLength: 200000,
                supportedMessageTypes: ['text'],
                supportsToolCalls: true,
                supportsStreaming: true,
                maxOutputTokens: 4096,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            });

            expect(mockLog.info).toHaveBeenCalledWith('Using static capabilities for chat model: claude-3-opus');
        });

        it('should fallback to defaults when no static capabilities exist', async () => {
            const fetchMethod = (service as any).fetchChatModelCapabilities.bind(service);
            const result = await fetchMethod('unknown-model');

            expect(result).toEqual({
                contextLength: 4096,
                supportedMessageTypes: ['text'],
                supportsToolCalls: false,
                supportsStreaming: true,
                maxOutputTokens: 2048,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            });

            expect(mockLog.info).toHaveBeenCalledWith('AI service doesn\'t support model capabilities - using defaults for model: unknown-model');
            expect(mockLog.info).toHaveBeenCalledWith('Using default capabilities for chat model: unknown-model');
        });

        it('should handle errors and return defaults', async () => {
            // Mock the MODEL_CAPABILITIES to throw an error
            vi.doMock('./constants/search_constants.js', () => {
                throw new Error('Failed to load constants');
            });

            const fetchMethod = (service as any).fetchChatModelCapabilities.bind(service);
            const result = await fetchMethod('test-model');

            expect(result).toEqual({
                contextLength: 4096,
                supportedMessageTypes: ['text'],
                supportsToolCalls: false,
                supportsStreaming: true,
                maxOutputTokens: 2048,
                temperature: { min: 0, max: 2, default: 0.7 },
                topP: { min: 0, max: 1, default: 0.9 }
            });
        });
    });

    describe('caching behavior', () => {
        it('should use cache for subsequent calls to same model', async () => {
            const spy = vi.spyOn(service as any, 'fetchChatModelCapabilities');

            // First call
            await service.getChatModelCapabilities('gpt-4');
            expect(spy).toHaveBeenCalledTimes(1);

            // Second call should use cache
            await service.getChatModelCapabilities('gpt-4');
            expect(spy).toHaveBeenCalledTimes(1); // Still 1, not called again

            spy.mockRestore();
        });

        it('should fetch separately for different models', async () => {
            const spy = vi.spyOn(service as any, 'fetchChatModelCapabilities');

            await service.getChatModelCapabilities('gpt-4');
            await service.getChatModelCapabilities('gpt-3.5-turbo');

            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy).toHaveBeenNthCalledWith(1, 'gpt-4');
            expect(spy).toHaveBeenNthCalledWith(2, 'gpt-3.5-turbo');

            spy.mockRestore();
        });

        it('should treat models with different cases as different entries', async () => {
            await service.getChatModelCapabilities('gpt-4');
            await service.getChatModelCapabilities('GPT-4');

            const cached = service.getCachedCapabilities();
            expect(Object.keys(cached)).toHaveLength(2);
            expect(cached['chat:gpt-4']).toBeDefined();
            expect(cached['chat:GPT-4']).toBeDefined();
        });
    });
});