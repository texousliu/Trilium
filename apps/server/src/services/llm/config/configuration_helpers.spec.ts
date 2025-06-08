import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as configHelpers from './configuration_helpers.js';
import configurationManager from './configuration_manager.js';
import optionService from '../../options.js';
import type { ProviderType, ModelIdentifier, ModelConfig } from '../interfaces/configuration_interfaces.js';

// Mock dependencies
vi.mock('./configuration_manager.js', () => ({
    default: {
        parseModelIdentifier: vi.fn(),
        createModelConfig: vi.fn(),
        getAIConfig: vi.fn(),
        validateConfig: vi.fn(),
        clearCache: vi.fn()
    }
}));

vi.mock('../../options.js', () => ({
    default: {
        getOption: vi.fn()
    }
}));

vi.mock('../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('configuration_helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getSelectedProvider', () => {
        it('should return the selected provider', async () => {
            vi.mocked(optionService.getOption).mockReturnValueOnce('openai');
            
            const result = await configHelpers.getSelectedProvider();
            
            expect(result).toBe('openai');
            expect(optionService.getOption).toHaveBeenCalledWith('aiSelectedProvider');
        });

        it('should return null if no provider is selected', async () => {
            vi.mocked(optionService.getOption).mockReturnValueOnce('');
            
            const result = await configHelpers.getSelectedProvider();
            
            expect(result).toBeNull();
        });

        it('should handle invalid provider and return null', async () => {
            vi.mocked(optionService.getOption).mockReturnValueOnce('invalid-provider');
            
            const result = await configHelpers.getSelectedProvider();
            
            expect(result).toBe('invalid-provider' as ProviderType);
        });
    });

    describe('parseModelIdentifier', () => {
        it('should delegate to configuration manager', () => {
            const mockIdentifier: ModelIdentifier = {
                provider: 'openai',
                modelId: 'gpt-4',
                fullIdentifier: 'openai:gpt-4'
            };
            vi.mocked(configurationManager.parseModelIdentifier).mockReturnValueOnce(mockIdentifier);
            
            const result = configHelpers.parseModelIdentifier('openai:gpt-4');
            
            expect(result).toBe(mockIdentifier);
            expect(configurationManager.parseModelIdentifier).toHaveBeenCalledWith('openai:gpt-4');
        });
    });

    describe('createModelConfig', () => {
        it('should delegate to configuration manager', () => {
            const mockConfig: ModelConfig = {
                provider: 'openai',
                modelId: 'gpt-4',
                temperature: 0.7,
                maxTokens: 1000
            } as any;
            vi.mocked(configurationManager.createModelConfig).mockReturnValueOnce(mockConfig);
            
            const result = configHelpers.createModelConfig('gpt-4', 'openai');
            
            expect(result).toBe(mockConfig);
            expect(configurationManager.createModelConfig).toHaveBeenCalledWith('gpt-4', 'openai');
        });
    });

    describe('getDefaultModelForProvider', () => {
        it('should return default model for provider', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {
                    openai: 'gpt-4',
                    anthropic: 'claude-3',
                    ollama: 'llama2'
                },
                providerSettings: {}
            } as any);
            
            const result = await configHelpers.getDefaultModelForProvider('openai');
            
            expect(result).toBe('gpt-4');
        });

        it('should return undefined if no default model', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {}
            } as any);
            
            const result = await configHelpers.getDefaultModelForProvider('openai');
            
            expect(result).toBeUndefined();
        });
    });

    describe('getProviderSettings', () => {
        it('should return provider settings', async () => {
            const mockSettings = {
                apiKey: 'test-key',
                baseUrl: 'https://api.openai.com'
            };
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {
                    openai: mockSettings
                }
            } as any);
            
            const result = await configHelpers.getProviderSettings('openai');
            
            expect(result).toBe(mockSettings);
        });

        it('should return undefined if no settings', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {}
            } as any);
            
            const result = await configHelpers.getProviderSettings('openai');
            
            expect(result).toBeUndefined();
        });
    });

    describe('isAIEnabled', () => {
        it('should return true if AI is enabled', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {}
            } as any);
            
            const result = await configHelpers.isAIEnabled();
            
            expect(result).toBe(true);
        });

        it('should return false if AI is disabled', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: false,
                selectedProvider: null,
                defaultModels: {},
                providerSettings: {}
            } as any);
            
            const result = await configHelpers.isAIEnabled();
            
            expect(result).toBe(false);
        });
    });

    describe('isProviderConfigured', () => {
        it('should return true for configured OpenAI', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {
                    openai: {
                        apiKey: 'test-key'
                    }
                }
            } as any);
            
            const result = await configHelpers.isProviderConfigured('openai');
            
            expect(result).toBe(true);
        });

        it('should return false for unconfigured OpenAI', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {
                    openai: {}
                }
            } as any);
            
            const result = await configHelpers.isProviderConfigured('openai');
            
            expect(result).toBe(false);
        });

        it('should return true for configured Anthropic', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'anthropic',
                defaultModels: {},
                providerSettings: {
                    anthropic: {
                        apiKey: 'test-key'
                    }
                }
            } as any);
            
            const result = await configHelpers.isProviderConfigured('anthropic');
            
            expect(result).toBe(true);
        });

        it('should return true for configured Ollama', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'ollama',
                defaultModels: {},
                providerSettings: {
                    ollama: {
                        baseUrl: 'http://localhost:11434'
                    }
                }
            } as any);
            
            const result = await configHelpers.isProviderConfigured('ollama');
            
            expect(result).toBe(true);
        });

        it('should return false for unknown provider', async () => {
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: null,
                defaultModels: {},
                providerSettings: {}
            } as any);
            
            const result = await configHelpers.isProviderConfigured('unknown' as ProviderType);
            
            expect(result).toBe(false);
        });
    });

    describe('getAvailableSelectedProvider', () => {
        it('should return selected provider if configured', async () => {
            vi.mocked(optionService.getOption).mockReturnValueOnce('openai');
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {
                    openai: {
                        apiKey: 'test-key'
                    }
                }
            } as any);
            
            const result = await configHelpers.getAvailableSelectedProvider();
            
            expect(result).toBe('openai');
        });

        it('should return null if no provider selected', async () => {
            vi.mocked(optionService.getOption).mockReturnValueOnce('');
            
            const result = await configHelpers.getAvailableSelectedProvider();
            
            expect(result).toBeNull();
        });

        it('should return null if selected provider not configured', async () => {
            vi.mocked(optionService.getOption).mockReturnValueOnce('openai');
            vi.mocked(configurationManager.getAIConfig).mockResolvedValueOnce({
                enabled: true,
                selectedProvider: 'openai',
                defaultModels: {},
                providerSettings: {
                    openai: {} // No API key
                }
            } as any);
            
            const result = await configHelpers.getAvailableSelectedProvider();
            
            expect(result).toBeNull();
        });
    });

    describe('validateConfiguration', () => {
        it('should delegate to configuration manager', async () => {
            const mockValidation = {
                isValid: true,
                errors: [],
                warnings: []
            };
            vi.mocked(configurationManager.validateConfig).mockResolvedValueOnce(mockValidation);
            
            const result = await configHelpers.validateConfiguration();
            
            expect(result).toBe(mockValidation);
            expect(configurationManager.validateConfig).toHaveBeenCalled();
        });
    });

    describe('clearConfigurationCache', () => {
        it('should clear configuration cache (no-op)', () => {
            // The function is now a no-op since caching was removed
            expect(() => configHelpers.clearConfigurationCache()).not.toThrow();
        });
    });
});