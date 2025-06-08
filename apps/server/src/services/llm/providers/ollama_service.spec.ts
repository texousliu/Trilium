import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaService } from './ollama_service.js';
import options from '../../options.js';
import * as providers from './providers.js';
import type { ChatCompletionOptions, Message } from '../ai_interface.js';
import { Ollama } from 'ollama';

// Mock dependencies
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

vi.mock('./providers.js', () => ({
    getOllamaOptions: vi.fn()
}));

vi.mock('../formatters/ollama_formatter.js', () => ({
    OllamaMessageFormatter: vi.fn().mockImplementation(() => ({
        formatMessages: vi.fn(),
        formatResponse: vi.fn()
    }))
}));

vi.mock('../tools/tool_registry.js', () => ({
    default: {
        getTools: vi.fn().mockReturnValue([]),
        executeTool: vi.fn()
    }
}));

vi.mock('./stream_handler.js', () => ({
    StreamProcessor: vi.fn(),
    createStreamHandler: vi.fn(),
    performProviderHealthCheck: vi.fn(),
    processProviderStream: vi.fn(),
    extractStreamStats: vi.fn()
}));

vi.mock('ollama', () => {
    const mockStream = {
        [Symbol.asyncIterator]: async function* () {
            yield {
                message: {
                    role: 'assistant',
                    content: 'Hello'
                },
                done: false
            };
            yield {
                message: {
                    role: 'assistant',
                    content: ' world'
                },
                done: true
            };
        }
    };

    const mockOllama = vi.fn().mockImplementation(() => ({
        chat: vi.fn().mockImplementation((params) => {
            if (params.stream) {
                return Promise.resolve(mockStream);
            }
            return Promise.resolve({
                message: {
                    role: 'assistant',
                    content: 'Hello! How can I help you today?'
                },
                created_at: '2024-01-01T00:00:00Z',
                model: 'llama2',
                done: true
            });
        }),
        show: vi.fn().mockResolvedValue({
            modelfile: 'FROM llama2',
            parameters: {},
            template: '',
            details: {
                format: 'gguf',
                family: 'llama',
                families: ['llama'],
                parameter_size: '7B',
                quantization_level: 'Q4_0'
            }
        }),
        list: vi.fn().mockResolvedValue({
            models: [
                {
                    name: 'llama2:latest',
                    modified_at: '2024-01-01T00:00:00Z',
                    size: 3800000000
                }
            ]
        })
    }));

    return { Ollama: mockOllama };
});

// Mock global fetch
global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue({})
});

describe('OllamaService', () => {
    let service: OllamaService;
    let mockOllamaInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new OllamaService();
        
        // Get the mocked Ollama instance
        const OllamaMock = vi.mocked(Ollama);
        mockOllamaInstance = new OllamaMock({ host: 'http://localhost:11434' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with provider name and formatter', () => {
            expect(service).toBeDefined();
            expect((service as any).providerName).toBe('Ollama');
            expect((service as any).formatter).toBeDefined();
        });
    });

    describe('isAvailable', () => {
        it('should return true when AI is enabled and base URL exists', () => {
            vi.mocked(options.getOptionBool).mockReturnValueOnce(true); // AI enabled
            vi.mocked(options.getOption).mockReturnValueOnce('http://localhost:11434'); // Base URL
            
            const result = service.isAvailable();
            
            expect(result).toBe(true);
        });

        it('should return false when AI is disabled', () => {
            vi.mocked(options.getOptionBool).mockReturnValueOnce(false); // AI disabled
            
            const result = service.isAvailable();
            
            expect(result).toBe(false);
        });

        it('should return false when no base URL', () => {
            vi.mocked(options.getOptionBool).mockReturnValueOnce(true); // AI enabled
            vi.mocked(options.getOption).mockReturnValueOnce(''); // No base URL
            
            const result = service.isAvailable();
            
            expect(result).toBe(false);
        });
    });

    describe('generateChatCompletion', () => {
        const messages: Message[] = [
            { role: 'user', content: 'Hello' }
        ];

        beforeEach(() => {
            vi.mocked(options.getOptionBool).mockReturnValue(true); // AI enabled
            vi.mocked(options.getOption)
                .mockReturnValueOnce('http://localhost:11434') // Base URL
                .mockReturnValueOnce('You are a helpful assistant'); // System prompt
        });

        it('should generate non-streaming completion', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                temperature: 0.7,
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            const result = await service.generateChatCompletion(messages);
            
            expect(result).toEqual({
                content: 'Hello! How can I help you today?',
                role: 'assistant',
                finish_reason: 'stop'
            });
        });

        it('should handle streaming completion', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                temperature: 0.7,
                stream: true,
                onChunk: vi.fn()
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            const result = await service.generateChatCompletion(messages);
            
            // Wait for chunks to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            expect(mockOptions.onChunk).toHaveBeenCalledTimes(2);
            expect(result).toEqual({
                content: 'Hello world',
                role: 'assistant',
                finish_reason: 'stop'
            });
        });

        it('should handle tools when enabled', async () => {
            const mockTools = [{
                name: 'test_tool',
                description: 'Test tool',
                parameters: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            }];
            
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false,
                enableTools: true,
                tools: mockTools
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            const chatSpy = vi.spyOn(mockOllamaInstance, 'chat');
            
            await service.generateChatCompletion(messages);
            
            const calledParams = chatSpy.mock.calls[0][0] as any;
            expect(calledParams.tools).toEqual(mockTools);
        });

        it('should throw error if service not available', async () => {
            vi.mocked(options.getOptionBool).mockReturnValueOnce(false); // AI disabled
            
            await expect(service.generateChatCompletion(messages)).rejects.toThrow(
                'Ollama service is not available'
            );
        });

        it('should throw error if no base URL configured', async () => {
            vi.mocked(options.getOption).mockReturnValueOnce(''); // No base URL
            
            await expect(service.generateChatCompletion(messages)).rejects.toThrow(
                'Ollama base URL is not configured'
            );
        });

        it('should handle API errors', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            // Mock API error
            mockOllamaInstance.chat.mockRejectedValueOnce(
                new Error('Connection refused')
            );
            
            await expect(service.generateChatCompletion(messages)).rejects.toThrow(
                'Ollama API error: Connection refused'
            );
        });

        it('should create client with custom fetch for debugging', () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            // Spy on Ollama constructor
            const OllamaMock = vi.mocked(Ollama);
            OllamaMock.mockClear();
            
            // Create new service to trigger client creation
            const newService = new OllamaService();
            newService.generateChatCompletion(messages);
            
            expect(OllamaMock).toHaveBeenCalledWith({
                host: 'http://localhost:11434',
                fetch: expect.any(Function)
            });
        });

        it('should handle tool execution feedback', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false,
                enableTools: true,
                tools: [{ name: 'test_tool', description: 'Test', parameters: {} }]
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            // Mock response with tool call
            mockOllamaInstance.chat.mockResolvedValueOnce({
                message: {
                    role: 'assistant',
                    content: '',
                    tool_calls: [{
                        id: 'call_123',
                        function: {
                            name: 'test_tool',
                            arguments: { key: 'value' }
                        }
                    }]
                },
                done: true
            });
            
            const result = await service.generateChatCompletion(messages);
            
            expect(result.tool_calls).toEqual([{
                id: 'call_123',
                type: 'function',
                function: {
                    name: 'test_tool',
                    arguments: '{"key":"value"}'
                }
            }]);
        });

        it('should handle mixed text and tool content', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            // Mock response with both text and tool calls
            mockOllamaInstance.chat.mockResolvedValueOnce({
                message: {
                    role: 'assistant',
                    content: 'Let me help you with that.',
                    tool_calls: [{
                        id: 'call_123',
                        function: {
                            name: 'calculate',
                            arguments: { x: 5, y: 3 }
                        }
                    }]
                },
                done: true
            });
            
            const result = await service.generateChatCompletion(messages);
            
            expect(result.text).toBe('Let me help you with that.');
            expect(result.tool_calls).toHaveLength(1);
        });

        it('should format messages using the formatter', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            const formattedMessages = [{ role: 'user', content: 'Hello' }];
            (service as any).formatter.formatMessages.mockReturnValueOnce(formattedMessages);
            
            const chatSpy = vi.spyOn(mockOllamaInstance, 'chat');
            
            await service.generateChatCompletion(messages);
            
            expect((service as any).formatter.formatMessages).toHaveBeenCalledWith(
                messages,
                'You are a helpful assistant'
            );
            expect(chatSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    messages: formattedMessages
                })
            );
        });

        it('should handle network errors gracefully', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            // Mock network error
            global.fetch = vi.fn().mockRejectedValueOnce(
                new Error('Network error')
            );
            
            mockOllamaInstance.chat.mockRejectedValueOnce(
                new Error('fetch failed')
            );
            
            await expect(service.generateChatCompletion(messages)).rejects.toThrow(
                'Ollama API error: fetch failed'
            );
        });

        it('should validate model availability', async () => {
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'nonexistent-model',
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValueOnce(mockOptions);
            
            // Mock model not found error
            mockOllamaInstance.chat.mockRejectedValueOnce(
                new Error('model "nonexistent-model" not found')
            );
            
            await expect(service.generateChatCompletion(messages)).rejects.toThrow(
                'Ollama API error: model "nonexistent-model" not found'
            );
        });
    });

    describe('client management', () => {
        it('should reuse existing client', async () => {
            vi.mocked(options.getOptionBool).mockReturnValue(true);
            vi.mocked(options.getOption).mockReturnValue('http://localhost:11434');
            
            const mockOptions = {
                baseUrl: 'http://localhost:11434',
                model: 'llama2',
                stream: false
            };
            vi.mocked(providers.getOllamaOptions).mockResolvedValue(mockOptions);
            
            const OllamaMock = vi.mocked(Ollama);
            OllamaMock.mockClear();
            
            // Make two calls
            await service.generateChatCompletion([{ role: 'user', content: 'Hello' }]);
            await service.generateChatCompletion([{ role: 'user', content: 'Hi' }]);
            
            // Should only create client once
            expect(OllamaMock).toHaveBeenCalledTimes(1);
        });
    });
});