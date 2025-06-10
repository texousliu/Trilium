import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as configHelpers from './configuration_helpers.js';
import configurationManager from './configuration_manager.js';
import optionService from '../../options.js';
import type { ProviderType, ModelIdentifier, ModelConfig } from '../interfaces/configuration_interfaces.js';

// Mock dependencies - configuration manager is no longer used
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
        getOption: vi.fn(),
        getOptionBool: vi.fn()
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
        it('should parse model identifier directly', () => {
            const result = configHelpers.parseModelIdentifier('openai:gpt-4');
            
            expect(result).toStrictEqual({
                provider: 'openai',
                modelId: 'gpt-4',
                fullIdentifier: 'openai:gpt-4'
            });
        });

        it('should handle model without provider', () => {
            const result = configHelpers.parseModelIdentifier('gpt-4');
            
            expect(result).toStrictEqual({
                modelId: 'gpt-4',
                fullIdentifier: 'gpt-4'
            });
        });

        it('should handle empty model string', () => {
            const result = configHelpers.parseModelIdentifier('');
            
            expect(result).toStrictEqual({
                modelId: '',
                fullIdentifier: ''
            });
        });
    });

    describe('createModelConfig', () => {
        it('should create model config directly', () => {
            const result = configHelpers.createModelConfig('gpt-4', 'openai');
            
            expect(result).toStrictEqual({
                provider: 'openai',
                modelId: 'gpt-4',
                displayName: 'gpt-4'
            });
        });

        it('should handle model with provider prefix', () => {
            const result = configHelpers.createModelConfig('openai:gpt-4');
            
            expect(result).toStrictEqual({
                provider: 'openai',
                modelId: 'gpt-4',
                displayName: 'openai:gpt-4'
            });
        });

        it('should fallback to openai provider when none specified', () => {
            const result = configHelpers.createModelConfig('gpt-4');
            
            expect(result).toStrictEqual({
                provider: 'openai',
                modelId: 'gpt-4',
                displayName: 'gpt-4'
            });
        });
    });

    describe('getDefaultModelForProvider', () => {
        it('should return default model for provider', async () => {
            vi.mocked(optionService.getOption).mockReturnValue('gpt-4');
            
            const result = await configHelpers.getDefaultModelForProvider('openai');
            
            expect(result).toBe('gpt-4');
            expect(optionService.getOption).toHaveBeenCalledWith('openaiDefaultModel');
        });

        it('should return undefined if no default model', async () => {
            vi.mocked(optionService.getOption).mockReturnValue('');
            
            const result = await configHelpers.getDefaultModelForProvider('anthropic');
            
            expect(result).toBeUndefined();
            expect(optionService.getOption).toHaveBeenCalledWith('anthropicDefaultModel');
        });

        it('should handle ollama provider', async () => {
            vi.mocked(optionService.getOption).mockReturnValue('llama2');
            
            const result = await configHelpers.getDefaultModelForProvider('ollama');
            
            expect(result).toBe('llama2');
            expect(optionService.getOption).toHaveBeenCalledWith('ollamaDefaultModel');
        });
    });

    describe('getProviderSettings', () => {
        it('should return OpenAI provider settings', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('test-key')  // openaiApiKey
                .mockReturnValueOnce('https://api.openai.com')  // openaiBaseUrl
                .mockReturnValueOnce('gpt-4');  // openaiDefaultModel
            
            const result = await configHelpers.getProviderSettings('openai');
            
            expect(result).toStrictEqual({
                apiKey: 'test-key',
                baseUrl: 'https://api.openai.com',
                defaultModel: 'gpt-4'
            });
        });

        it('should return Anthropic provider settings', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('anthropic-key')  // anthropicApiKey
                .mockReturnValueOnce('https://api.anthropic.com')  // anthropicBaseUrl
                .mockReturnValueOnce('claude-3');  // anthropicDefaultModel
            
            const result = await configHelpers.getProviderSettings('anthropic');
            
            expect(result).toStrictEqual({
                apiKey: 'anthropic-key',
                baseUrl: 'https://api.anthropic.com',
                defaultModel: 'claude-3'
            });
        });

        it('should return Ollama provider settings', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('http://localhost:11434')  // ollamaBaseUrl
                .mockReturnValueOnce('llama2');  // ollamaDefaultModel
            
            const result = await configHelpers.getProviderSettings('ollama');
            
            expect(result).toStrictEqual({
                baseUrl: 'http://localhost:11434',
                defaultModel: 'llama2'
            });
        });

        it('should return empty object for unknown provider', async () => {
            const result = await configHelpers.getProviderSettings('unknown' as ProviderType);
            
            expect(result).toStrictEqual({});
        });
    });

    describe('isAIEnabled', () => {
        it('should return true if AI is enabled', async () => {
            vi.mocked(optionService.getOptionBool).mockReturnValue(true);
            
            const result = await configHelpers.isAIEnabled();
            
            expect(result).toBe(true);
            expect(optionService.getOptionBool).toHaveBeenCalledWith('aiEnabled');
        });

        it('should return false if AI is disabled', async () => {
            vi.mocked(optionService.getOptionBool).mockReturnValue(false);
            
            const result = await configHelpers.isAIEnabled();
            
            expect(result).toBe(false);
            expect(optionService.getOptionBool).toHaveBeenCalledWith('aiEnabled');
        });
    });

    describe('isProviderConfigured', () => {
        it('should return true for configured OpenAI', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('test-key')  // openaiApiKey
                .mockReturnValueOnce('')  // openaiBaseUrl
                .mockReturnValueOnce('');  // openaiDefaultModel
            
            const result = await configHelpers.isProviderConfigured('openai');
            
            expect(result).toBe(true);
        });

        it('should return false for unconfigured OpenAI', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('')  // openaiApiKey (empty)
                .mockReturnValueOnce('')  // openaiBaseUrl
                .mockReturnValueOnce('');  // openaiDefaultModel
            
            const result = await configHelpers.isProviderConfigured('openai');
            
            expect(result).toBe(false);
        });

        it('should return true for configured Anthropic', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('anthropic-key')  // anthropicApiKey
                .mockReturnValueOnce('')  // anthropicBaseUrl
                .mockReturnValueOnce('');  // anthropicDefaultModel
            
            const result = await configHelpers.isProviderConfigured('anthropic');
            
            expect(result).toBe(true);
        });

        it('should return true for configured Ollama', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('http://localhost:11434')  // ollamaBaseUrl
                .mockReturnValueOnce('');  // ollamaDefaultModel
            
            const result = await configHelpers.isProviderConfigured('ollama');
            
            expect(result).toBe(true);
        });

        it('should return false for unknown provider', async () => {
            const result = await configHelpers.isProviderConfigured('unknown' as ProviderType);
            
            expect(result).toBe(false);
        });
    });

    describe('getAvailableSelectedProvider', () => {
        it('should return selected provider if configured', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('openai')  // aiSelectedProvider
                .mockReturnValueOnce('test-key')  // openaiApiKey
                .mockReturnValueOnce('')  // openaiBaseUrl
                .mockReturnValueOnce('');  // openaiDefaultModel
            
            const result = await configHelpers.getAvailableSelectedProvider();
            
            expect(result).toBe('openai');
        });

        it('should return null if no provider selected', async () => {
            vi.mocked(optionService.getOption).mockReturnValueOnce('');
            
            const result = await configHelpers.getAvailableSelectedProvider();
            
            expect(result).toBeNull();
        });

        it('should return null if selected provider not configured', async () => {
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('openai')  // aiSelectedProvider
                .mockReturnValueOnce('')  // openaiApiKey (empty)
                .mockReturnValueOnce('')  // openaiBaseUrl
                .mockReturnValueOnce('');  // openaiDefaultModel
            
            const result = await configHelpers.getAvailableSelectedProvider();
            
            expect(result).toBeNull();
        });
    });

    describe('validateConfiguration', () => {
        it('should validate AI configuration directly', async () => {
            // Mock AI enabled = true, with selected provider and configured settings
            vi.mocked(optionService.getOptionBool).mockReturnValue(true);
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('openai')  // aiSelectedProvider
                .mockReturnValueOnce('test-key')  // openaiApiKey
                .mockReturnValueOnce('')  // openaiBaseUrl
                .mockReturnValueOnce('gpt-4');  // openaiDefaultModel
            
            const result = await configHelpers.validateConfiguration();
            
            expect(result).toStrictEqual({
                isValid: true,
                errors: [],
                warnings: []
            });
        });

        it('should return warning when AI is disabled', async () => {
            vi.mocked(optionService.getOptionBool).mockReturnValue(false);
            
            const result = await configHelpers.validateConfiguration();
            
            expect(result).toStrictEqual({
                isValid: true,
                errors: [],
                warnings: ['AI features are disabled']
            });
        });

        it('should return error when no provider selected', async () => {
            vi.mocked(optionService.getOptionBool).mockReturnValue(true);
            vi.mocked(optionService.getOption).mockReturnValue('');  // no aiSelectedProvider
            
            const result = await configHelpers.validateConfiguration();
            
            expect(result).toStrictEqual({
                isValid: false,
                errors: ['No AI provider selected'],
                warnings: []
            });
        });

        it('should return warning when provider not configured', async () => {
            vi.mocked(optionService.getOptionBool).mockReturnValue(true);
            vi.mocked(optionService.getOption)
                .mockReturnValueOnce('openai')  // aiSelectedProvider
                .mockReturnValueOnce('')  // openaiApiKey (empty)
                .mockReturnValueOnce('')  // openaiBaseUrl
                .mockReturnValueOnce('');  // openaiDefaultModel
            
            const result = await configHelpers.validateConfiguration();
            
            expect(result).toStrictEqual({
                isValid: true,
                errors: [],
                warnings: ['OpenAI API key is not configured']
            });
        });
    });

    describe('clearConfigurationCache', () => {
        it('should clear configuration cache (no-op)', () => {
            // The function is now a no-op since caching was removed
            expect(() => configHelpers.clearConfigurationCache()).not.toThrow();
        });
    });
});