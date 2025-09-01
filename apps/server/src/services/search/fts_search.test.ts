/**
 * Tests for minimal FTS5 search service
 * 
 * This test file validates the core FTS5 functionality:
 * 1. FTS5 availability checking
 * 2. Basic search operations
 * 3. Protected notes handling
 * 4. Error handling
 * 5. Index statistics
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Database } from 'better-sqlite3';

// Mock dependencies
vi.mock('../sql.js');
vi.mock('../log.js');
vi.mock('../protected_session.js');

describe('FTS5 Search Service', () => {
    let ftsSearchService: any;
    let mockSql: any;
    let mockLog: any;
    let mockProtectedSession: any;

    beforeEach(async () => {
        // Reset mocks
        vi.resetModules();
        
        // Setup mocks
        mockSql = {
            getValue: vi.fn(),
            getRow: vi.fn(),
            getRows: vi.fn(),
            getColumn: vi.fn(),
            execute: vi.fn(),
            prepare: vi.fn(),
            iterateRows: vi.fn(),
            transactional: vi.fn((fn: Function) => fn())
        };
        
        mockLog = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            request: vi.fn()
        };
        
        mockProtectedSession = {
            isProtectedSessionAvailable: vi.fn().mockReturnValue(false),
            decryptString: vi.fn()
        };
        
        // Mock the modules
        vi.doMock('../sql.js', () => ({ default: mockSql }));
        vi.doMock('../log.js', () => ({ default: mockLog }));
        vi.doMock('../protected_session.js', () => ({ default: mockProtectedSession }));
        
        // Import the service after mocking
        const module = await import('./fts_search.js');
        ftsSearchService = module.default;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('FTS5 Availability', () => {
        it('should detect when FTS5 is available', () => {
            mockSql.getRow.mockReturnValue({ 1: 1 });
            mockSql.getValue.mockReturnValue(1);
            
            const result = ftsSearchService.checkFTS5Availability();
            
            expect(result).toBe(true);
            expect(mockSql.getRow).toHaveBeenCalledWith(expect.stringContaining('pragma_compile_options'));
            expect(mockSql.getValue).toHaveBeenCalledWith(expect.stringContaining('notes_fts'));
        });

        it('should detect when FTS5 is not available', () => {
            mockSql.getRow.mockReturnValue(null);
            
            const result = ftsSearchService.checkFTS5Availability();
            
            expect(result).toBe(false);
        });

        it('should cache FTS5 availability check', () => {
            mockSql.getRow.mockReturnValue({ 1: 1 });
            mockSql.getValue.mockReturnValue(1);
            
            // First call
            ftsSearchService.checkFTS5Availability();
            // Second call should use cached value
            ftsSearchService.checkFTS5Availability();
            
            // Should only be called once
            expect(mockSql.getRow).toHaveBeenCalledTimes(1);
        });
    });

    describe('Basic Search', () => {
        beforeEach(() => {
            mockSql.getRow.mockReturnValue({ 1: 1 });
            mockSql.getValue.mockReturnValue(1);
        });

        it('should perform basic word search', () => {
            const mockResults = [
                { noteId: 'note1', title: 'Test Note', score: 1.0 }
            ];
            mockSql.getRows.mockReturnValue(mockResults);
            
            const results = ftsSearchService.searchSync(['test'], '*=*');
            
            expect(results).toEqual(mockResults);
            expect(mockSql.getRows).toHaveBeenCalledWith(
                expect.stringContaining('MATCH'),
                expect.arrayContaining([expect.stringContaining('test')])
            );
        });

        it('should handle phrase search', () => {
            mockSql.getRows.mockReturnValue([]);
            
            ftsSearchService.searchSync(['hello', 'world'], '=');
            
            expect(mockSql.getRows).toHaveBeenCalledWith(
                expect.stringContaining('MATCH'),
                expect.arrayContaining(['"hello world"'])
            );
        });

        it('should apply limit and offset', () => {
            mockSql.getRows.mockReturnValue([]);
            
            ftsSearchService.searchSync(['test'], '=', undefined, { 
                limit: 50, 
                offset: 10 
            });
            
            expect(mockSql.getRows).toHaveBeenCalledWith(
                expect.stringContaining('LIMIT'),
                expect.arrayContaining([expect.any(String), 50, 10])
            );
        });

        it('should filter by noteIds when provided', () => {
            mockSql.getRows.mockReturnValue([]);
            const noteIds = new Set(['note1', 'note2']);
            
            ftsSearchService.searchSync(['test'], '=', noteIds);
            
            expect(mockSql.getRows).toHaveBeenCalledWith(
                expect.stringContaining("IN ('note1','note2')"),
                expect.any(Array)
            );
        });
    });

    describe('Protected Notes', () => {
        beforeEach(() => {
            mockSql.getRow.mockReturnValue({ 1: 1 });
            mockSql.getValue.mockReturnValue(1);
        });

        it('should not return protected notes in regular search', () => {
            mockSql.getRows.mockReturnValue([]);
            
            ftsSearchService.searchSync(['test'], '=');
            
            expect(mockSql.getRows).toHaveBeenCalledWith(
                expect.stringContaining('isProtected = 0'),
                expect.any(Array)
            );
        });

        it('should search protected notes separately when session available', () => {
            mockProtectedSession.isProtectedSessionAvailable.mockReturnValue(true);
            mockProtectedSession.decryptString.mockReturnValue('decrypted content test');
            
            const mockIterator = function*() {
                yield {
                    noteId: 'protected1',
                    title: 'Protected Note',
                    content: 'encrypted',
                    type: 'text',
                    mime: 'text/html'
                };
            };
            mockSql.iterateRows.mockReturnValue(mockIterator());
            
            const results = ftsSearchService.searchProtectedNotesSync(['test'], '*=*');
            
            expect(results).toHaveLength(1);
            expect(results[0].noteId).toBe('protected1');
            expect(mockProtectedSession.decryptString).toHaveBeenCalledWith('encrypted');
        });

        it('should skip protected notes that cannot be decrypted', () => {
            mockProtectedSession.isProtectedSessionAvailable.mockReturnValue(true);
            mockProtectedSession.decryptString.mockReturnValue(null);
            
            const mockIterator = function*() {
                yield {
                    noteId: 'protected1',
                    title: 'Protected Note',
                    content: 'encrypted',
                    type: 'text',
                    mime: 'text/html'
                };
            };
            mockSql.iterateRows.mockReturnValue(mockIterator());
            
            const results = ftsSearchService.searchProtectedNotesSync(['test'], '*=*');
            
            expect(results).toHaveLength(0);
        });
    });

    describe('Error Handling', () => {
        it('should throw FTSNotAvailableError when FTS5 is not available', () => {
            mockSql.getRow.mockReturnValue(null);
            
            expect(() => {
                ftsSearchService.searchSync(['test'], '=');
            }).toThrow('FTS5 is not available');
        });

        it('should throw FTSQueryError for invalid queries', () => {
            mockSql.getRow.mockReturnValue({ 1: 1 });
            mockSql.getValue.mockReturnValue(1);
            mockSql.getRows.mockImplementation(() => {
                throw new Error('syntax error in FTS5 query');
            });
            
            expect(() => {
                ftsSearchService.searchSync(['test'], '=');
            }).toThrow('Invalid FTS5 query');
        });
    });

    describe('Index Management', () => {
        beforeEach(() => {
            mockSql.getRow.mockReturnValue({ 1: 1 });
            mockSql.getValue.mockReturnValue(1);
        });

        it('should sync missing notes to index', () => {
            const missingNotes = [
                { noteId: 'note1', title: 'Note 1', content: 'Content 1' },
                { noteId: 'note2', title: 'Note 2', content: 'Content 2' }
            ];
            mockSql.getRows.mockReturnValue(missingNotes);
            
            // Mock prepared statement
            const mockPreparedStatement = {
                run: vi.fn(),
                finalize: vi.fn()
            };
            mockSql.prepare.mockReturnValue(mockPreparedStatement);
            
            const count = ftsSearchService.syncMissingNotes();
            
            expect(count).toBe(2);
            expect(mockSql.prepare).toHaveBeenCalledTimes(1);
            expect(mockPreparedStatement.run).toHaveBeenCalledTimes(2);
            expect(mockPreparedStatement.finalize).toHaveBeenCalledTimes(1);
        });

        it('should optimize index', () => {
            ftsSearchService.optimizeIndex();
            
            expect(mockSql.execute).toHaveBeenCalledWith(
                expect.stringContaining('optimize')
            );
        });

        it('should get index statistics', () => {
            mockSql.getValue
                .mockReturnValueOnce(1)    // FTS5 availability check
                .mockReturnValueOnce(100)  // document count
                .mockReturnValueOnce(5000); // index size
            
            const stats = ftsSearchService.getStatistics();
            
            expect(stats.documentCount).toBe(100);
            expect(stats.indexSize).toBe(5000);
        });

        it('should handle errors in statistics gracefully', () => {
            mockSql.getValue.mockImplementation(() => {
                throw new Error('Database error');
            });
            
            const stats = ftsSearchService.getStatistics();
            
            expect(stats.documentCount).toBe(0);
            expect(stats.indexSize).toBe(0);
        });
    });

    describe('Query Building', () => {
        beforeEach(() => {
            mockSql.getRow.mockReturnValue({ 1: 1 });
            mockSql.getValue.mockReturnValue(1);
            mockSql.getRows.mockReturnValue([]);
        });

        it('should build correct FTS5 query for different operators', () => {
            const testCases = [
                { tokens: ['test'], operator: '=', expected: '"test"' },
                { tokens: ['hello', 'world'], operator: '=', expected: '"hello world"' },
                { tokens: ['test'], operator: '*=*', expected: '"test"' },
                { tokens: ['test', 'word'], operator: '*=*', expected: '"test" AND "word"' },
                { tokens: ['test'], operator: '!=', expected: 'NOT "test"' },
                { tokens: ['test'], operator: '*=', expected: '*test' },
                { tokens: ['test'], operator: '=*', expected: 'test*' },
                { tokens: ['test', 'word'], operator: '~=', expected: '"test" OR "word"' },
            ];

            for (const { tokens, operator, expected } of testCases) {
                mockSql.getRows.mockClear();
                ftsSearchService.searchSync(tokens, operator);
                
                expect(mockSql.getRows).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.arrayContaining([expected, expect.any(Number), expect.any(Number)])
                );
            }
        });

        it('should escape special characters in tokens', () => {
            ftsSearchService.searchSync(['test"quote'], '=');
            
            expect(mockSql.getRows).toHaveBeenCalledWith(
                expect.any(String),
                expect.arrayContaining(['"test""quote"', expect.any(Number), expect.any(Number)])
            );
        });
    });
});