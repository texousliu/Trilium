import importSingle from '../../../src/services/import/single.js';
import importUtils from '../../../src/services/import/utils.js';
import BNote from '../../../src/becca/entities/bnote.js';
import TaskContext from '../../../src/services/task_context.js';

describe('HTML Import', () => {
    let parentNote: BNote;
    let taskContext: TaskContext;

    beforeEach(() => {
        // Create a mock parent note
        parentNote = new BNote({
            noteId: 'testParent',
            title: 'Test Parent',
            type: 'text',
            mime: 'text/html'
        });

        // Create a mock task context
        taskContext = new TaskContext('test', 'test');
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
                </html>`;
            
            const title = importUtils.extractHtmlTitle(html);
            expect(title).toBe('Test Title');
        });

        it('should handle missing title tag', () => {
            const html = `
                <html>
                    <head></head>
                    <body>
                        <p>Content</p>
                    </body>
                </html>`;
            
            const title = importUtils.extractHtmlTitle(html);
            expect(title).toBeNull();
        });

        it('should handle title with special characters', () => {
            const html = `
                <html>
                    <head>
                        <title>Test/Title: With Special &amp; Characters</title>
                    </head>
                    <body>
                        <p>Content</p>
                    </body>
                </html>`;
            
            const title = importUtils.extractHtmlTitle(html);
            expect(title).toBe('Test/Title: With Special & Characters');
        });
    });

    describe('importHtml', () => {
        it('should prefer title from HTML over filename', () => {
            const file = {
                originalname: 'test.html',
                buffer: Buffer.from(`
                    <html>
                        <head>
                            <title>HTML Title</title>
                        </head>
                        <body>
                            <p>Content</p>
                        </body>
                    </html>`),
                mimetype: 'text/html'
            };

            const note = importSingle.importHtml(taskContext, file, parentNote);
            expect(note.title).toBe('HTML Title');
        });

        it('should fall back to filename when no HTML title exists', () => {
            const file = {
                originalname: 'test_file.html',
                buffer: Buffer.from(`
                    <html>
                        <head></head>
                        <body>
                            <p>Content</p>
                        </body>
                    </html>`),
                mimetype: 'text/html'
            };

            const note = importSingle.importHtml(taskContext, file, parentNote);
            expect(note.title).toBe('test file'); // assuming replaceUnderscoresWithSpaces is true
        });

        it('should handle HTML with both title and H1', () => {
            const file = {
                originalname: 'test.html',
                buffer: Buffer.from(`
                    <html>
                        <head>
                            <title>HTML Title</title>
                        </head>
                        <body>
                            <h1>Different H1 Title</h1>
                            <p>Content</p>
                        </body>
                    </html>`),
                mimetype: 'text/html'
            };

            const note = importSingle.importHtml(taskContext, file, parentNote);
            expect(note.title).toBe('HTML Title');
            expect(note.content).toContain('<h1>HTML Title</h1>'); // H1 should be updated to match title
        });

        it('should preserve special characters in title', () => {
            const file = {
                originalname: 'test.html',
                buffer: Buffer.from(`
                    <html>
                        <head>
                            <title>Title/With: Special &amp; Characters</title>
                        </head>
                        <body>
                            <p>Content</p>
                        </body>
                    </html>`),
                mimetype: 'text/html'
            };

            const note = importSingle.importHtml(taskContext, file, parentNote);
            expect(note.title).toBe('Title/With: Special & Characters');
        });
    });
});
