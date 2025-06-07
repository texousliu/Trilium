import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIServiceManager } from './ai_service_manager.js';
import options from '../options.js';
import eventService from '../events.js';
import { AnthropicService } from './providers/anthropic_service.js';
import { OpenAIService } from './providers/openai_service.js';
import { OllamaService } from './providers/ollama_service.js';
import * as configHelpers from './config/configuration_helpers.js';
import type { AIService, ChatCompletionOptions, Message } from './ai_interface.js';

// Mock dependencies
vi.mock('../options.js', () => ({
    default: {
        getOption: vi.fn(),
        getOptionBool: vi.fn()
    }
}));

vi.mock('../events.js', () => ({
    default: {
        subscribe: vi.fn()
    }
}));

vi.mock('../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

vi.mock('./providers/anthropic_service.js', () => ({
    AnthropicService: vi.fn().mockImplementation(() => ({
        isAvailable: vi.fn().mockReturnValue(true),
        generateChatCompletion: vi.fn()
    }))
}));

vi.mock('./providers/openai_service.js', () => ({
    OpenAIService: vi.fn().mockImplementation(() => ({
        isAvailable: vi.fn().mockReturnValue(true),
        generateChatCompletion: vi.fn()
    }))
}));

vi.mock('./providers/ollama_service.js', () => ({
    OllamaService: vi.fn().mockImplementation(() => ({
        isAvailable: vi.fn().mockReturnValue(true),
        generateChatCompletion: vi.fn()
    }))
}));

vi.mock('./config/configuration_helpers.js', () => ({
    getSelectedProvider: vi.fn(),
    parseModelIdentifier: vi.fn(),
    isAIEnabled: vi.fn(),
    getDefaultModelForProvider: vi.fn(),
    clearConfigurationCache: vi.fn(),
    validateConfiguration: vi.fn()
}));

vi.mock('./context/index.js', () => ({
    ContextExtractor: vi.fn().mockImplementation(() => ({}))
}));

vi.mock('./context_extractors/index.js', () => ({
    default: {
        getTools: vi.fn().mockReturnValue({
            noteNavigator: {},
            queryDecomposition: {},
            contextualThinking: {}
        }),
        getAllTools: vi.fn().mockReturnValue([])
    }
}));

vi.mock('./context/services/context_service.js', () => ({
    default: {
        findRelevantNotes: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('./tools/tool_initializer.js', () => ({
    default: {
        initializeTools: vi.fn().mockResolvedValue(undefined)
    }
}));

describe('AIServiceManager', () => {
    let manager: AIServiceManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new AIServiceManager();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize tools and set up event listeners', () => {
            expect(eventService.subscribe).toHaveBeenCalled();
        });
    });

    describe('getSelectedProviderAsync', () => {
        it('should return the selected provider', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce('openai');
            
            const result = await manager.getSelectedProviderAsync();
            
            expect(result).toBe('openai');
            expect(configHelpers.getSelectedProvider).toHaveBeenCalled();
        });

        it('should return null if no provider is selected', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce(null);
            
            const result = await manager.getSelectedProviderAsync();
            
            expect(result).toBeNull();
        });

        it('should handle errors and return null', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockRejectedValueOnce(new Error('Config error'));
            
            const result = await manager.getSelectedProviderAsync();
            
            expect(result).toBeNull();
        });
    });

    describe('validateConfiguration', () => {
        it('should return null for valid configuration', async () => {
            vi.mocked(configHelpers.validateConfiguration).mockResolvedValueOnce({
                isValid: true,
                errors: [],
                warnings: []
            });
            
            const result = await manager.validateConfiguration();
            
            expect(result).toBeNull();
        });

        it('should return error message for invalid configuration', async () => {
            vi.mocked(configHelpers.validateConfiguration).mockResolvedValueOnce({
                isValid: false,
                errors: ['Missing API key', 'Invalid model'],
                warnings: []
            });
            
            const result = await manager.validateConfiguration();
            
            expect(result).toContain('There are issues with your AI configuration');
            expect(result).toContain('Missing API key');
            expect(result).toContain('Invalid model');
        });

        it('should include warnings in valid configuration', async () => {
            vi.mocked(configHelpers.validateConfiguration).mockResolvedValueOnce({
                isValid: true,
                errors: [],
                warnings: ['Model not optimal']
            });
            
            const result = await manager.validateConfiguration();
            
            expect(result).toBeNull();
        });
    });

    describe('getOrCreateAnyService', () => {
        it('should create and return the selected provider service', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce('openai');
            vi.mocked(options.getOption).mockReturnValueOnce('test-api-key');
            
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true),
                generateChatCompletion: vi.fn()
            };
            vi.mocked(OpenAIService).mockImplementationOnce(() => mockService as any);
            
            const result = await manager.getOrCreateAnyService();
            
            expect(result).toBe(mockService);
        });

        it('should throw error if no provider is selected', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce(null);
            
            await expect(manager.getOrCreateAnyService()).rejects.toThrow(
                'No AI provider is selected'
            );
        });

        it('should throw error if selected provider is not available', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce('openai');
            vi.mocked(options.getOption).mockReturnValueOnce(null); // No API key
            
            await expect(manager.getOrCreateAnyService()).rejects.toThrow(
                'Selected AI provider (openai) is not available'
            );
        });
    });

    describe('isAnyServiceAvailable', () => {
        it('should return true if any provider is available', () => {
            vi.mocked(options.getOption).mockReturnValueOnce('test-api-key');
            
            const result = manager.isAnyServiceAvailable();
            
            expect(result).toBe(true);
        });

        it('should return false if no providers are available', () => {
            vi.mocked(options.getOption).mockReturnValue(null);
            
            const result = manager.isAnyServiceAvailable();
            
            expect(result).toBe(false);
        });
    });

    describe('getAvailableProviders', () => {
        it('should return list of available providers', () => {
            vi.mocked(options.getOption)
                .mockReturnValueOnce('openai-key')
                .mockReturnValueOnce('anthropic-key')
                .mockReturnValueOnce(null); // No Ollama URL
            
            const result = manager.getAvailableProviders();
            
            expect(result).toEqual(['openai', 'anthropic']);
        });

        it('should include already created services', () => {
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true)
            };
            (manager as any).services.openai = mockService;
            
            const result = manager.getAvailableProviders();
            
            expect(result).toContain('openai');
        });
    });

    describe('generateChatCompletion', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello' }
        ];

        it('should generate completion with selected provider', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce('openai');
            vi.mocked(options.getOption).mockReturnValueOnce('test-api-key');
            
            const mockResponse = { content: 'Hello response' };
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true),
                generateChatCompletion: vi.fn().mockResolvedValueOnce(mockResponse)
            };
            vi.mocked(OpenAIService).mockImplementationOnce(() => mockService as any);
            
            const result = await manager.generateChatCompletion(messages);
            
            expect(result).toBe(mockResponse);
            expect(mockService.generateChatCompletion).toHaveBeenCalledWith(messages, {});
        });

        it('should handle provider prefix in model', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce('openai');
            vi.mocked(configHelpers.parseModelIdentifier).mockReturnValueOnce({
                provider: 'openai',
                modelId: 'gpt-4'
            });
            vi.mocked(options.getOption).mockReturnValueOnce('test-api-key');
            
            const mockResponse = { content: 'Hello response' };
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true),
                generateChatCompletion: vi.fn().mockResolvedValueOnce(mockResponse)
            };
            vi.mocked(OpenAIService).mockImplementationOnce(() => mockService as any);
            
            const result = await manager.generateChatCompletion(messages, { 
                model: 'openai:gpt-4' 
            });
            
            expect(result).toBe(mockResponse);
            expect(mockService.generateChatCompletion).toHaveBeenCalledWith(
                messages, 
                { model: 'gpt-4' }
            );
        });

        it('should throw error if no messages provided', async () => {
            await expect(manager.generateChatCompletion([])).rejects.toThrow(
                'No messages provided'
            );
        });

        it('should throw error if no provider selected', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce(null);
            
            await expect(manager.generateChatCompletion(messages)).rejects.toThrow(
                'No AI provider is selected'
            );
        });

        it('should throw error if model specifies different provider', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce('openai');
            vi.mocked(configHelpers.parseModelIdentifier).mockReturnValueOnce({
                provider: 'anthropic',
                modelId: 'claude-3'
            });
            
            await expect(
                manager.generateChatCompletion(messages, { model: 'anthropic:claude-3' })
            ).rejects.toThrow(
                "Model specifies provider 'anthropic' but selected provider is 'openai'"
            );
        });
    });

    describe('getAIEnabledAsync', () => {
        it('should return AI enabled status', async () => {
            vi.mocked(configHelpers.isAIEnabled).mockResolvedValueOnce(true);
            
            const result = await manager.getAIEnabledAsync();
            
            expect(result).toBe(true);
            expect(configHelpers.isAIEnabled).toHaveBeenCalled();
        });
    });

    describe('getAIEnabled', () => {
        it('should return AI enabled status synchronously', () => {
            vi.mocked(options.getOptionBool).mockReturnValueOnce(true);
            
            const result = manager.getAIEnabled();
            
            expect(result).toBe(true);
            expect(options.getOptionBool).toHaveBeenCalledWith('aiEnabled');
        });
    });

    describe('initialize', () => {
        it('should initialize if AI is enabled', async () => {
            vi.mocked(configHelpers.isAIEnabled).mockResolvedValueOnce(true);
            
            await manager.initialize();
            
            expect(configHelpers.isAIEnabled).toHaveBeenCalled();
        });

        it('should not initialize if AI is disabled', async () => {
            vi.mocked(configHelpers.isAIEnabled).mockResolvedValueOnce(false);
            
            await manager.initialize();
            
            expect(configHelpers.isAIEnabled).toHaveBeenCalled();
        });
    });

    describe('getService', () => {
        it('should return service for specified provider', async () => {
            vi.mocked(options.getOption).mockReturnValueOnce('test-api-key');
            
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true),
                generateChatCompletion: vi.fn()
            };
            vi.mocked(OpenAIService).mockImplementationOnce(() => mockService as any);
            
            const result = await manager.getService('openai');
            
            expect(result).toBe(mockService);
        });

        it('should return selected provider service if no provider specified', async () => {
            vi.mocked(configHelpers.getSelectedProvider).mockResolvedValueOnce('anthropic');
            vi.mocked(options.getOption).mockReturnValueOnce('test-api-key');
            
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true),
                generateChatCompletion: vi.fn()
            };
            vi.mocked(AnthropicService).mockImplementationOnce(() => mockService as any);
            
            const result = await manager.getService();
            
            expect(result).toBe(mockService);
        });

        it('should throw error if specified provider not available', async () => {
            vi.mocked(options.getOption).mockReturnValueOnce(null); // No API key
            
            await expect(manager.getService('openai')).rejects.toThrow(
                'Specified provider openai is not available'
            );
        });
    });

    describe('getSelectedProvider', () => {
        it('should return selected provider synchronously', () => {
            vi.mocked(options.getOption).mockReturnValueOnce('anthropic');
            
            const result = manager.getSelectedProvider();
            
            expect(result).toBe('anthropic');
        });

        it('should return default provider if none selected', () => {
            vi.mocked(options.getOption).mockReturnValueOnce(null);
            
            const result = manager.getSelectedProvider();
            
            expect(result).toBe('openai');
        });
    });

    describe('isProviderAvailable', () => {
        it('should return true if provider service is available', () => {
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true)
            };
            (manager as any).services.openai = mockService;
            
            const result = manager.isProviderAvailable('openai');
            
            expect(result).toBe(true);
        });

        it('should return false if provider service not created', () => {
            const result = manager.isProviderAvailable('openai');
            
            expect(result).toBe(false);
        });
    });

    describe('getProviderMetadata', () => {
        it('should return metadata for existing provider', () => {
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true)
            };
            (manager as any).services.openai = mockService;
            
            const result = manager.getProviderMetadata('openai');
            
            expect(result).toEqual({
                name: 'openai',
                capabilities: {
                    chat: true,
                    streaming: true,
                    functionCalling: true
                },
                models: ['default'],
                defaultModel: 'default'
            });
        });

        it('should return null for non-existing provider', () => {
            const result = manager.getProviderMetadata('openai');
            
            expect(result).toBeNull();
        });
    });

    describe('event handling', () => {
        it('should recreate services on AI option changes', async () => {
            const eventCallback = vi.mocked(eventService.subscribe).mock.calls[0][1];
            
            await eventCallback({
                entityName: 'options',
                entity: { name: 'openaiApiKey', value: 'new-key' }
            });
            
            expect(configHelpers.clearConfigurationCache).toHaveBeenCalled();
        });

        it('should initialize on aiEnabled set to true', async () => {
            const eventCallback = vi.mocked(eventService.subscribe).mock.calls[0][1];
            vi.mocked(configHelpers.isAIEnabled).mockResolvedValueOnce(true);
            
            await eventCallback({
                entityName: 'options',
                entity: { name: 'aiEnabled', value: 'true' }
            });
            
            expect(configHelpers.isAIEnabled).toHaveBeenCalled();
        });

        it('should clear providers on aiEnabled set to false', async () => {
            const mockService = {
                isAvailable: vi.fn().mockReturnValue(true)
            };
            (manager as any).services.openai = mockService;
            
            const eventCallback = vi.mocked(eventService.subscribe).mock.calls[0][1];
            
            await eventCallback({
                entityName: 'options',
                entity: { name: 'aiEnabled', value: 'false' }
            });
            
            expect((manager as any).services).toEqual({});
        });
    });
});