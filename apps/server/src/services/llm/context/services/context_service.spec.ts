import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContextService } from './context_service.js';
import type { ContextOptions } from './context_service.js';
import type { NoteSearchResult } from '../../interfaces/context_interfaces.js';
import type { LLMServiceInterface } from '../../interfaces/agent_tool_interfaces.js';

// Mock dependencies
vi.mock('../../../log.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

vi.mock('../modules/cache_manager.js', () => ({
    default: {
        get: vi.fn(),
        set: vi.fn(),
        clear: vi.fn()
    }
}));

vi.mock('./query_processor.js', () => ({
    default: {
        enhanceQuery: vi.fn().mockResolvedValue('enhanced query'),
        decomposeQuery: vi.fn().mockResolvedValue({
            subQueries: ['sub query 1', 'sub query 2'],
            thinking: 'decomposition thinking'
        })
    }
}));

vi.mock('../modules/context_formatter.js', () => ({
    default: {
        formatNotes: vi.fn().mockReturnValue('formatted context'),
        formatResponse: vi.fn().mockReturnValue('formatted response')
    }
}));

vi.mock('../../ai_service_manager.js', () => ({
    default: {
        getContextExtractor: vi.fn().mockReturnValue({
            findRelevantNotes: vi.fn().mockResolvedValue([])
        })
    }
}));

vi.mock('../index.js', () => ({
    ContextExtractor: vi.fn().mockImplementation(() => ({
        findRelevantNotes: vi.fn().mockResolvedValue([])
    }))
}));

describe('ContextService', () => {
    let service: ContextService;
    let mockLLMService: LLMServiceInterface;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new ContextService();
        
        mockLLMService = {
            generateChatCompletion: vi.fn().mockResolvedValue({
                content: 'Mock LLM response',
                role: 'assistant'
            }),
            isAvailable: vi.fn().mockReturnValue(true)
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default state', () => {
            expect(service).toBeDefined();
            expect((service as any).initialized).toBe(false);
            expect((service as any).initPromise).toBeNull();
            expect((service as any).contextExtractor).toBeDefined();
        });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            await service.initialize();
            
            expect((service as any).initialized).toBe(true);
            expect((service as any).initPromise).toBeNull();
        });

        it('should not initialize twice', async () => {
            await service.initialize();
            await service.initialize(); // Second call should be a no-op
            
            expect((service as any).initialized).toBe(true);
        });

        it('should handle concurrent initialization calls', async () => {
            const promises = [
                service.initialize(),
                service.initialize(),
                service.initialize()
            ];
            
            await Promise.all(promises);
            
            expect((service as any).initialized).toBe(true);
        });

        it('should handle initialization errors', async () => {
            // Mock an error in initialization
            const originalContextExtractor = (service as any).contextExtractor;
            (service as any).contextExtractor = null; // Force an error
            
            await expect(service.initialize()).rejects.toThrow();
            
            // Restore for cleanup
            (service as any).contextExtractor = originalContextExtractor;
        });
    });

    describe('processQuery', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        const userQuestion = 'What are the main features of the application?';

        it('should process query with default options', async () => {
            const mockNotes: NoteSearchResult[] = [
                {
                    noteId: 'note1',
                    title: 'Features Overview',
                    content: 'The app has many features...',
                    relevanceScore: 0.9,
                    searchType: 'content'
                }
            ];

            (service as any).contextExtractor.findRelevantNotes.mockResolvedValueOnce(mockNotes);

            const result = await service.processQuery(userQuestion, mockLLMService);

            expect(result).toEqual({
                context: 'formatted context',
                sources: mockNotes,
                thinking: undefined,
                decomposedQuery: undefined
            });
        });

        it('should handle summarized content option', async () => {
            const options: ContextOptions = {
                summarizeContent: true,
                maxResults: 5
            };

            const mockNotes: NoteSearchResult[] = [
                {
                    noteId: 'note1',
                    title: 'Long Content',
                    content: 'This is a very long piece of content that should be summarized...',
                    relevanceScore: 0.8,
                    searchType: 'content'
                }
            ];

            (service as any).contextExtractor.findRelevantNotes.mockResolvedValueOnce(mockNotes);

            const result = await service.processQuery(userQuestion, mockLLMService, options);

            expect(result.sources).toEqual(mockNotes);
            expect((service as any).contextExtractor.findRelevantNotes).toHaveBeenCalledWith(
                userQuestion,
                null,
                expect.objectContaining({
                    maxResults: 5,
                    summarize: true,
                    llmService: mockLLMService
                })
            );
        });

        it('should handle query enhancement option', async () => {
            const options: ContextOptions = {
                useQueryEnhancement: true
            };

            const queryProcessor = (await import('./query_processor.js')).default;
            
            await service.processQuery(userQuestion, mockLLMService, options);

            expect(queryProcessor.enhanceQuery).toHaveBeenCalledWith(
                userQuestion,
                mockLLMService
            );
        });

        it('should handle query decomposition option', async () => {
            const options: ContextOptions = {
                useQueryDecomposition: true,
                showThinking: true
            };

            const queryProcessor = (await import('./query_processor.js')).default;
            
            const result = await service.processQuery(userQuestion, mockLLMService, options);

            expect(queryProcessor.decomposeQuery).toHaveBeenCalledWith(
                userQuestion,
                mockLLMService
            );
            expect(result.thinking).toBe('decomposition thinking');
            expect(result.decomposedQuery).toEqual({
                subQueries: ['sub query 1', 'sub query 2'],
                thinking: 'decomposition thinking'
            });
        });

        it('should respect context note ID', async () => {
            const options: ContextOptions = {
                contextNoteId: 'specific-note-123'
            };

            await service.processQuery(userQuestion, mockLLMService, options);

            expect((service as any).contextExtractor.findRelevantNotes).toHaveBeenCalledWith(
                userQuestion,
                'specific-note-123',
                expect.any(Object)
            );
        });

        it('should handle empty search results', async () => {
            (service as any).contextExtractor.findRelevantNotes.mockResolvedValueOnce([]);

            const result = await service.processQuery(userQuestion, mockLLMService);

            expect(result).toEqual({
                context: 'formatted context',
                sources: [],
                thinking: undefined,
                decomposedQuery: undefined
            });
        });

        it('should handle errors in context extraction', async () => {
            (service as any).contextExtractor.findRelevantNotes.mockRejectedValueOnce(
                new Error('Context extraction failed')
            );

            await expect(
                service.processQuery(userQuestion, mockLLMService)
            ).rejects.toThrow('Context extraction failed');
        });

        it('should handle errors in query enhancement', async () => {
            const options: ContextOptions = {
                useQueryEnhancement: true
            };

            const queryProcessor = (await import('./query_processor.js')).default;
            queryProcessor.enhanceQuery.mockRejectedValueOnce(
                new Error('Query enhancement failed')
            );

            await expect(
                service.processQuery(userQuestion, mockLLMService, options)
            ).rejects.toThrow('Query enhancement failed');
        });

        it('should handle errors in query decomposition', async () => {
            const options: ContextOptions = {
                useQueryDecomposition: true
            };

            const queryProcessor = (await import('./query_processor.js')).default;
            queryProcessor.decomposeQuery.mockRejectedValueOnce(
                new Error('Query decomposition failed')
            );

            await expect(
                service.processQuery(userQuestion, mockLLMService, options)
            ).rejects.toThrow('Query decomposition failed');
        });
    });

    describe('findRelevantNotes', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should find relevant notes with default options', async () => {
            const mockNotes: NoteSearchResult[] = [
                {
                    noteId: 'note1',
                    title: 'Relevant Note',
                    content: 'This note is relevant to the query',
                    relevanceScore: 0.85,
                    searchType: 'content'
                }
            ];

            (service as any).contextExtractor.findRelevantNotes.mockResolvedValueOnce(mockNotes);

            const result = await service.findRelevantNotes(
                'test query',
                'context-note-123',
                {}
            );

            expect(result).toEqual(mockNotes);
            expect((service as any).contextExtractor.findRelevantNotes).toHaveBeenCalledWith(
                'test query',
                'context-note-123',
                {}
            );
        });

        it('should pass through options to context extractor', async () => {
            const options = {
                maxResults: 15,
                summarize: true,
                llmService: mockLLMService
            };

            await service.findRelevantNotes('test query', null, options);

            expect((service as any).contextExtractor.findRelevantNotes).toHaveBeenCalledWith(
                'test query',
                null,
                options
            );
        });

        it('should handle null context note ID', async () => {
            await service.findRelevantNotes('test query', null, {});

            expect((service as any).contextExtractor.findRelevantNotes).toHaveBeenCalledWith(
                'test query',
                null,
                {}
            );
        });
    });

    describe('error handling', () => {
        it('should handle service not initialized', async () => {
            const uninitializedService = new ContextService();
            
            // Don't initialize the service
            await expect(
                uninitializedService.processQuery('test', mockLLMService)
            ).rejects.toThrow();
        });

        it('should handle invalid LLM service', async () => {
            await service.initialize();
            
            const invalidLLMService = {
                generateChatCompletion: vi.fn().mockRejectedValue(new Error('LLM error')),
                isAvailable: vi.fn().mockReturnValue(false)
            };

            const options: ContextOptions = {
                useQueryEnhancement: true
            };

            await expect(
                service.processQuery('test', invalidLLMService, options)
            ).rejects.toThrow();
        });

        it('should handle context formatter errors', async () => {
            await service.initialize();
            
            const contextFormatter = (await import('../modules/context_formatter.js')).default;
            contextFormatter.formatNotes.mockImplementationOnce(() => {
                throw new Error('Formatting error');
            });

            await expect(
                service.processQuery('test', mockLLMService)
            ).rejects.toThrow('Formatting error');
        });
    });

    describe('performance', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should handle large result sets efficiently', async () => {
            const largeResultSet: NoteSearchResult[] = Array.from({ length: 100 }, (_, i) => ({
                noteId: `note${i}`,
                title: `Note ${i}`,
                content: `Content for note ${i}`,
                relevanceScore: Math.random(),
                searchType: 'content' as const
            }));

            (service as any).contextExtractor.findRelevantNotes.mockResolvedValueOnce(largeResultSet);

            const startTime = Date.now();
            const result = await service.processQuery('test query', mockLLMService, {
                maxResults: 50
            });
            const endTime = Date.now();

            expect(result.sources).toHaveLength(100); // Should return all found notes
            expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
        });

        it('should handle concurrent queries', async () => {
            const queries = [
                'First query',
                'Second query',
                'Third query'
            ];

            const promises = queries.map(query =>
                service.processQuery(query, mockLLMService)
            );

            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            expect((service as any).contextExtractor.findRelevantNotes).toHaveBeenCalledTimes(3);
        });
    });
});