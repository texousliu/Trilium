import 'jasmine';
import importSingle from '../../../src/services/import/single.js';
import importUtils from '../../../src/services/import/utils.js';
import BNote from '../../../src/becca/entities/bnote.js';
import TaskContext from '../../../src/services/task_context.js';
import sql from '../../../src/services/sql.js';
import cls from '../../../src/services/cls.js';

describe('HTML Import', () => {
    let parentNote: BNote;
    let taskContext: TaskContext;

    beforeAll(() => {
        // Set up in-memory database for testing
        process.env.TRILIUM_INTEGRATION_TEST = 'memory';
    });

    beforeEach(() => {
        return cls.init(() => {
            return sql.transactional(() => {
                // Create required tables
                sql.execute(`
                    CREATE TABLE IF NOT EXISTS notes (
                        noteId TEXT PRIMARY KEY,
                        title TEXT,
                        type TEXT,
                        mime TEXT,
                        isProtected INTEGER DEFAULT 0,
                        isDeleted INTEGER DEFAULT 0
                    )
                `);

                sql.execute(`
                    CREATE TABLE IF NOT EXISTS note_contents (
                        noteId TEXT PRIMARY KEY,
                        content TEXT,
                        hash TEXT,
                        utcDateModified TEXT
                    )
                `);

                sql.execute(`
                    CREATE TABLE IF NOT EXISTS entity_changes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        entityName TEXT NOT NULL,
                        entityId TEXT NOT NULL,
                        hash TEXT NOT NULL,
                        isErased INTEGER NOT NULL,
                        isSynced INTEGER NOT NULL,
                        utcDateChanged TEXT NOT NULL,
                        changeId TEXT NOT NULL,
                        componentId TEXT,
                        instanceId TEXT
                    )
                `);

                // Create a mock parent note
                parentNote = new BNote({
                    noteId: 'testParent',
                    title: 'Test Parent',
                    type: 'text',
                    mime: 'text/html'
                });

                // Create a mock task context
                taskContext = new TaskContext('test', 'test');
                // Set textImportedAsText to true to ensure HTML imports are processed
                taskContext.data = { textImportedAsText: true };
                
                // Insert parent note
                sql.insert('notes', {
                    noteId: parentNote.noteId,
                    title: parentNote.title,
                    type: parentNote.type,
                    mime: parentNote.mime,
                    isProtected: 0,
                    isDeleted: 0
                });
            });
        });
    });

    describe('extractHtmlTitle', () => {
        it('should extract title from HTML content', () => {
            const html = `
                <html>
                    <head>
                        <title>Test Title</title>
                    </head>
                    <body>
                        <p>Content</p>
                    </body>
                </html>
            `;

            const title = importUtils.extractHtmlTitle(html);
            expect(title).toBe('Test Title');
        });

        it('should return null if no title tag is present', () => {
            const html = `
                <html>
                    <head>
                    </head>
                    <body>
                        <p>Content</p>
                    </body>
                </html>
            `;

            const title = importUtils.extractHtmlTitle(html);
            expect(title).toBeNull();
        });
    });

    describe('importSingleFile with HTML', () => {
        it('should import HTML file with title from title tag', () => {
            return cls.init(() => {
                return sql.transactional(() => {
                    const file = {
                        originalname: 'test.html',
                        mimetype: 'text/html',
                        buffer: Buffer.from(`
                            <html>
                                <head>
                                    <title>HTML Title</title>
                                </head>
                                <body>
                                    <p>Test content</p>
                                </body>
                            </html>
                        `)
                    };

                    const note = importSingle.importSingleFile(taskContext, file, parentNote);
                    expect(note.title).toBe('HTML Title');
                    expect(note.mime).toBe('text/html');
                });
            });
        });

        it('should import HTML file with title from h1 when no title tag', () => {
            return cls.init(() => {
                return sql.transactional(() => {
                    const file = {
                        originalname: 'test.html',
                        mimetype: 'text/html',
                        buffer: Buffer.from(`
                            <html>
                                <body>
                                    <h1>Heading Title</h1>
                                    <p>Test content</p>
                                </body>
                            </html>
                        `)
                    };

                    const note = importSingle.importSingleFile(taskContext, file, parentNote);
                    expect(note.title).toBe('Heading Title');
                    expect(note.mime).toBe('text/html');
                });
            });
        });

        it('should import HTML file with filename as title when no title or h1', () => {
            return cls.init(() => {
                return sql.transactional(() => {
                    const file = {
                        originalname: 'test-document.html',
                        mimetype: 'text/html',
                        buffer: Buffer.from(`
                            <html>
                                <body>
                                    <p>Test content without title</p>
                                </body>
                            </html>
                        `)
                    };

                    const note = importSingle.importSingleFile(taskContext, file, parentNote);
                    expect(note.title).toBe('test-document');
                    expect(note.mime).toBe('text/html');
                });
            });
        });

        it('should sanitize HTML content during import', () => {
            return cls.init(() => {
                return sql.transactional(() => {
                    const file = {
                        originalname: 'test.html',
                        mimetype: 'text/html',
                        buffer: Buffer.from(`
                            <html>
                                <head>
                                    <title>Test Title</title>
                                    <script>alert('xss');</script>
                                </head>
                                <body>
                                    <p>Safe content</p>
                                    <script>alert('xss');</script>
                                </body>
                            </html>
                        `)
                    };

                    const note = importSingle.importSingleFile(taskContext, file, parentNote);
                    expect(note.title).toBe('Test Title');
                    const content = note.getContent();
                    expect(content).not.toContain('<script>');
                    expect(content).toContain('<p>Safe content</p>');
                });
            });
        });
    });
});
