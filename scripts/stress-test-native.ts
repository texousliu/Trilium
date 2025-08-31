#!/usr/bin/env tsx
/**
 * Native API Stress Test Utility
 * Uses Trilium's native services to create notes instead of direct DB access
 * 
 * Usage: 
 *   cd apps/server && NODE_ENV=development pnpm tsx ../../scripts/stress-test-native.ts <number-of-notes> [batch-size]
 * 
 * Example:
 *   cd apps/server && NODE_ENV=development pnpm tsx ../../scripts/stress-test-native.ts 10000       # Create 10,000 notes
 *   cd apps/server && NODE_ENV=development pnpm tsx ../../scripts/stress-test-native.ts 1000 100    # Create 1,000 notes in batches of 100
 */

// Set up environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATA_DIR = process.env.DATA_DIR || './data';

// Resource manager for proper cleanup
class ResourceManager {
    private resources: Array<{ name: string; cleanup: () => void | Promise<void> }> = [];
    private cleanedUp = false;

    register(name: string, cleanup: () => void | Promise<void>): void {
        console.log(`[ResourceManager] Registered resource: ${name}`);
        this.resources.push({ name, cleanup });
    }

    async cleanup(): Promise<void> {
        if (this.cleanedUp) {
            console.log('[ResourceManager] Already cleaned up, skipping...');
            return;
        }

        console.log('[ResourceManager] Starting cleanup...');
        this.cleanedUp = true;

        // Cleanup in reverse order of registration
        for (let i = this.resources.length - 1; i >= 0; i--) {
            const resource = this.resources[i];
            try {
                console.log(`[ResourceManager] Cleaning up: ${resource.name}`);
                await resource.cleanup();
                console.log(`[ResourceManager] Successfully cleaned up: ${resource.name}`);
            } catch (error) {
                console.error(`[ResourceManager] Error cleaning up ${resource.name}:`, error);
            }
        }

        this.resources = [];
        console.log('[ResourceManager] Cleanup completed');
    }
}

// Global resource manager
const resourceManager = new ResourceManager();

// Setup process exit handlers
process.on('exit', (code) => {
    console.log(`[Process] Exiting with code: ${code}`);
});

process.on('SIGINT', async () => {
    console.log('\n[Process] Received SIGINT, cleaning up...');
    await resourceManager.cleanup();
    process.exit(130); // Standard exit code for SIGINT
});

process.on('SIGTERM', async () => {
    console.log('\n[Process] Received SIGTERM, cleaning up...');
    await resourceManager.cleanup();
    process.exit(143); // Standard exit code for SIGTERM
});

process.on('uncaughtException', async (error) => {
    console.error('[Process] Uncaught exception:', error);
    await resourceManager.cleanup();
    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('[Process] Unhandled rejection at:', promise, 'reason:', reason);
    await resourceManager.cleanup();
    process.exit(1);
});

// Import Trilium services after setting up environment and handlers
import './src/becca/entity_constructor.js';
import sqlInit from './src/services/sql_init.js';
import noteService from './src/services/notes.js';
import attributeService from './src/services/attributes.js';
import cls from './src/services/cls.js';
import cloningService from './src/services/cloning.js';
import sql from './src/services/sql.js';
import becca from './src/becca/becca.js';
import entityChangesService from './src/services/entity_changes.js';
import type BNote from './src/becca/entities/bnote.js';

// Parse command line arguments
const noteCount = parseInt(process.argv[2]);
const batchSize = parseInt(process.argv[3]) || 100;

if (!noteCount || noteCount < 1) {
    console.error(`Please enter number of notes as program parameter.`);
    console.error(`Usage: cd apps/server && NODE_ENV=development pnpm tsx ../../scripts/stress-test-native.ts <number-of-notes> [batch-size]`);
    process.exit(1);
}

console.log(`\n🚀 Trilium Native API Stress Test Utility`);
console.log(`==========================================`);
console.log(`  Notes to create: ${noteCount.toLocaleString()}`);
console.log(`  Batch size: ${batchSize.toLocaleString()}`);
console.log(`  Using native Trilium services`);
console.log(`==========================================\n`);

// Word lists for generating content
const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde',
    'omnis', 'iste', 'natus', 'error', 'voluptatem', 'accusantium', 'doloremque'
];

const titleTemplates = [
    'Project ${word1} ${word2}',
    'Meeting Notes: ${word1} ${word2}',
    'TODO: ${word1} ${word2} ${word3}',
    'Research on ${word1} and ${word2}',
    'Analysis of ${word1} ${word2}',
    'Guide to ${word1} ${word2}',
    'Notes about ${word1}',
    '${word1} ${word2} Documentation',
    'Summary: ${word1} ${word2} ${word3}',
    'Report on ${word1} ${word2}',
    'Task: ${word1} Implementation',
    'Review of ${word1} ${word2}'
];

const attributeNames = [
    'archived', 'hideInNote', 'readOnly', 'cssClass', 'iconClass',
    'pageSize', 'viewType', 'template', 'widget', 'index',
    'label', 'promoted', 'hideChildrenOverview', 'collapsed',
    'sortDirection', 'color', 'weight', 'fontSize', 'fontFamily',
    'priority', 'status', 'category', 'tag', 'milestone'
];

const noteTypes = ['text', 'code', 'book', 'render', 'canvas', 'mermaid', 'search', 'relationMap'];

function getRandomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
}

function capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function generateTitle(): string {
    const template = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    return template
        .replace('${word1}', capitalize(getRandomWord()))
        .replace('${word2}', capitalize(getRandomWord()))
        .replace('${word3}', capitalize(getRandomWord()));
}

function generateContent(minParagraphs: number = 1, maxParagraphs: number = 10): string {
    const paragraphCount = Math.floor(Math.random() * (maxParagraphs - minParagraphs) + minParagraphs);
    const paragraphs = [];
    
    for (let i = 0; i < paragraphCount; i++) {
        const sentenceCount = Math.floor(Math.random() * 5) + 3;
        const sentences = [];
        
        for (let j = 0; j < sentenceCount; j++) {
            const wordCount = Math.floor(Math.random() * 15) + 5;
            const sentenceWords = [];
            
            for (let k = 0; k < wordCount; k++) {
                sentenceWords.push(getRandomWord());
            }
            
            sentenceWords[0] = capitalize(sentenceWords[0]);
            sentences.push(sentenceWords.join(' ') + '.');
        }
        
        paragraphs.push(`<p>${sentences.join(' ')}</p>`);
    }
    
    return paragraphs.join('\n');
}

function generateCodeContent(): string {
    const templates = [
        `function ${getRandomWord()}() {\n    // ${generateSentence()}\n    return ${Math.random() > 0.5 ? 'true' : 'false'};\n}`,
        `const ${getRandomWord()} = {\n    ${getRandomWord()}: "${getRandomWord()}",\n    ${getRandomWord()}: ${Math.floor(Math.random() * 1000)}\n};`,
        `class ${capitalize(getRandomWord())} {\n    constructor() {\n        this.${getRandomWord()} = "${getRandomWord()}";\n    }\n    
    ${getRandomWord()}() {\n        return this.${getRandomWord()};\n    }\n}`,
        `SELECT * FROM ${getRandomWord()} WHERE ${getRandomWord()} = '${getRandomWord()}';`,
        `#!/bin/bash\n# ${generateSentence()}\necho "${generateSentence()}"\n${getRandomWord()}="${getRandomWord()}"\nexport ${getRandomWord().toUpperCase()}`,
        `import { ${getRandomWord()} } from './${getRandomWord()}';\nimport * as ${getRandomWord()} from '${getRandomWord()}';\n\nexport function ${getRandomWord()}() {\n    return ${getRandomWord()}();\n}`,
        `# ${generateTitle()}\n\n## ${capitalize(getRandomWord())}\n\n${generateSentence()}\n\n\`\`\`python\ndef ${getRandomWord()}():\n    return "${getRandomWord()}"\n\`\`\``,
        `apiVersion: v1\nkind: ${capitalize(getRandomWord())}\nmetadata:\n  name: ${getRandomWord()}\nspec:\n  ${getRandomWord()}: ${getRandomWord()}`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

function generateMermaidContent(): string {
    const templates = [
        `graph TD\n    A[${capitalize(getRandomWord())}] --> B[${capitalize(getRandomWord())}]\n    B --> C[${capitalize(getRandomWord())}]\n    C --> D[${capitalize(getRandomWord())}]`,
        `sequenceDiagram\n    ${capitalize(getRandomWord())}->>+${capitalize(getRandomWord())}: ${generateSentence()}\n    ${capitalize(getRandomWord())}-->>-${capitalize(getRandomWord())}: ${getRandomWord()}`,
        `flowchart LR\n    Start --> ${capitalize(getRandomWord())}\n    ${capitalize(getRandomWord())} --> ${capitalize(getRandomWord())}\n    ${capitalize(getRandomWord())} --> End`,
        `classDiagram\n    class ${capitalize(getRandomWord())} {\n        +${getRandomWord()}()\n        -${getRandomWord()}\n    }\n    class ${capitalize(getRandomWord())} {\n        +${getRandomWord()}()\n    }`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
}

function generateSentence(): string {
    const wordCount = Math.floor(Math.random() * 10) + 5;
    const wordList = [];
    for (let i = 0; i < wordCount; i++) {
        wordList.push(getRandomWord());
    }
    wordList[0] = capitalize(wordList[0]);
    return wordList.join(' ');
}

async function runStressTest(): Promise<void> {
    let exitCode = 0;
    const startTime = Date.now();
    const allNotes: BNote[] = [];
    let notesCreated = 0;
    let attributesCreated = 0;
    let clonesCreated = 0;
    let revisionsCreated = 0;
    
    try {
        console.log('Starting note generation using native Trilium services...\n');
        
        // Find root note
        const rootNote = becca.getNote('root');
        if (!rootNote) {
            throw new Error('Root note not found! Database might not be initialized properly.');
        }
        
        // Create a container note for our stress test
        console.log('Creating container note...');
        const { note: containerNote } = noteService.createNewNote({
            parentNoteId: 'root',
            title: `Stress Test ${new Date().toISOString()}`,
            content: `<p>Container for stress test with ${noteCount} notes</p>`,
            type: 'text',
            isProtected: false
        });
        
        console.log(`Created container note: ${containerNote.title} (${containerNote.noteId})`);
        allNotes.push(containerNote);
        
        // Process in batches for better control
        for (let batch = 0; batch < Math.ceil(noteCount / batchSize); batch++) {
            const batchStart = batch * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, noteCount);
            const batchNoteCount = batchEnd - batchStart;
            
            try {
                sql.transactional(() => {
                    for (let i = 0; i < batchNoteCount; i++) {
                        const type = noteTypes[Math.floor(Math.random() * noteTypes.length)];
                        let content = '';
                        let mime = undefined;
                        
                        // Generate content based on type
                        switch (type) {
                            case 'code':
                                content = generateCodeContent();
                                mime = 'text/plain';
                                break;
                            case 'mermaid':
                                content = generateMermaidContent();
                                mime = 'text/plain';
                                break;
                            case 'canvas':
                                content = JSON.stringify({
                                    elements: [],
                                    appState: { viewBackgroundColor: "#ffffff" },
                                    files: {}
                                });
                                mime = 'application/json';
                                break;
                            case 'search':
                                content = JSON.stringify({
                                    searchString: `#${getRandomWord()} OR #${getRandomWord()}`
                                });
                                mime = 'application/json';
                                break;
                            case 'relationMap':
                                content = JSON.stringify({
                                    notes: [],
                                    zoom: 1
                                });
                                mime = 'application/json';
                                break;
                            default:
                                content = generateContent();
                                mime = 'text/html';
                        }
                        
                        // Decide parent - either container or random existing note for complex hierarchy
                        let parentNoteId = containerNote.noteId;
                        if (allNotes.length > 10 && Math.random() < 0.3) {
                            // 30% chance to attach to random existing note
                            parentNoteId = allNotes[Math.floor(Math.random() * Math.min(allNotes.length, 100))].noteId;
                        }
                        
                        // Create the note using native service
                        const { note, branch } = noteService.createNewNote({
                            parentNoteId,
                            title: generateTitle(),
                            content,
                            type,
                            mime,
                            isProtected: Math.random() < 0.05 // 5% protected notes
                        });
                        
                        notesCreated++;
                        allNotes.push(note);
                        
                        // Add attributes using native service
                        const attributeCount = Math.floor(Math.random() * 8);
                        for (let a = 0; a < attributeCount; a++) {
                            const attrType = Math.random() < 0.7 ? 'label' : 'relation';
                            const attrName = attributeNames[Math.floor(Math.random() * attributeNames.length)];
                            
                            try {
                                if (attrType === 'label') {
                                    attributeService.createLabel(
                                        note.noteId, 
                                        attrName, 
                                        Math.random() < 0.5 ? getRandomWord() : ''
                                    );
                                    attributesCreated++;
                                } else if (allNotes.length > 1) {
                                    const targetNote = allNotes[Math.floor(Math.random() * Math.min(allNotes.length, 50))];
                                    attributeService.createRelation(
                                        note.noteId, 
                                        attrName, 
                                        targetNote.noteId
                                    );
                                    attributesCreated++;
                                }
                            } catch (e) {
                                // Ignore attribute creation errors (e.g., duplicates)
                                if (e instanceof Error && !e.message.includes('duplicate') && !e.message.includes('already exists')) {
                                    console.warn(`Unexpected attribute error: ${e.message}`);
                                }
                            }
                        }
                        
                        // Update note content occasionally to trigger revisions
                        if (Math.random() < 0.1) { // 10% chance
                            note.setContent(content + `\n<p>Updated at ${new Date().toISOString()}</p>`);
                            note.save();
                            
                            // Save revision
                            if (Math.random() < 0.5) {
                                try {
                                    note.saveRevision();
                                    revisionsCreated++;
                                } catch (e) {
                                    // Ignore revision errors
                                }
                            }
                        }
                        
                        // Create clones occasionally for complex relationships
                        if (allNotes.length > 20 && Math.random() < 0.05) { // 5% chance
                            try {
                                const targetParent = allNotes[Math.floor(Math.random() * allNotes.length)];
                                const result = cloningService.cloneNoteToBranch(
                                    note.noteId, 
                                    targetParent.noteId,
                                    Math.random() < 0.2 ? 'clone' : ''
                                );
                                if (result.success) {
                                    clonesCreated++;
                                }
                            } catch (e) {
                                // Ignore cloning errors (e.g., circular dependencies)
                            }
                        }
                        
                        // Add note to recent notes occasionally
                        if (Math.random() < 0.1) { // 10% chance
                            try {
                                sql.execute(
                                    "INSERT OR IGNORE INTO recent_notes (noteId, notePath, utcDateCreated) VALUES (?, ?, ?)",
                                    [note.noteId, note.getBestNotePath()?.path || 'root', note.utcDateCreated]
                                );
                            } catch (e) {
                                // Table might not exist in all versions
                            }
                        }
                        
                        // Keep memory usage in check
                        if (allNotes.length > 500) {
                            allNotes.splice(0, allNotes.length - 500);
                        }
                    }
                })();
                
                const progress = Math.round(((batch + 1) / Math.ceil(noteCount / batchSize)) * 100);
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = Math.round(notesCreated / elapsed);
                
                console.log(`Progress: ${progress}% | Notes: ${notesCreated}/${noteCount} | Rate: ${rate}/sec | Attrs: ${attributesCreated} | Clones: ${clonesCreated} | Revisions: ${revisionsCreated}`);
                
            } catch (error) {
                console.error(`Failed to process batch ${batch + 1}:`, error);
                throw error;
            }
            
            // Force entity changes sync (non-critical)
            try {
                entityChangesService.putNoteReorderingEntityChange(containerNote.noteId);
            } catch (e) {
                // Ignore entity change errors
            }
        }
        
        // Create some advanced structures
        console.log('\nCreating advanced relationships...');
        
        try {
            // Create template notes
            const templateNote = noteService.createNewNote({
                parentNoteId: containerNote.noteId,
                title: 'Template: ' + generateTitle(),
                content: '<p>This is a template note</p>',
                type: 'text',
                isProtected: false
            }).note;
            
            attributeService.createLabel(templateNote.noteId, 'template', '');
            
            // Apply template to some notes
            for (let i = 0; i < Math.min(10, allNotes.length); i++) {
                const targetNote = allNotes[Math.floor(Math.random() * allNotes.length)];
                try {
                    attributeService.createRelation(targetNote.noteId, 'template', templateNote.noteId);
                } catch (e) {
                    // Ignore relation errors
                }
            }
            
            // Create some CSS notes
            const cssNote = noteService.createNewNote({
                parentNoteId: containerNote.noteId,
                title: 'Custom CSS',
                content: `.custom-class { color: #${Math.floor(Math.random()*16777215).toString(16)}; }`,
                type: 'code',
                mime: 'text/css',
                isProtected: false
            }).note;
            
            attributeService.createLabel(cssNote.noteId, 'appCss', '');
            
            // Create widget notes
            const widgetNote = noteService.createNewNote({
                parentNoteId: containerNote.noteId,
                title: 'Custom Widget',
                content: `<div>Widget content: ${generateSentence()}</div>`,
                type: 'code',
                mime: 'text/html',
                isProtected: false
            }).note;
            
            attributeService.createLabel(widgetNote.noteId, 'widget', '');
        } catch (error) {
            console.warn('Failed to create some advanced structures:', error);
            // Non-critical, continue
        }
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        // Get final statistics
        console.log('\nGathering database statistics...');
        let stats: any = {};
        try {
            stats.notes = sql.getValue('SELECT COUNT(*) FROM notes');
            stats.branches = sql.getValue('SELECT COUNT(*) FROM branches');
            stats.attributes = sql.getValue('SELECT COUNT(*) FROM attributes');
            stats.revisions = sql.getValue('SELECT COUNT(*) FROM revisions');
            stats.attachments = sql.getValue('SELECT COUNT(*) FROM attachments');
            stats.recentNotes = sql.getValue('SELECT COUNT(*) FROM recent_notes');
        } catch (error) {
            console.warn('Failed to get some statistics:', error);
        }
        
        console.log('\n✅ Native API stress test completed successfully!\n');
        console.log('Database Statistics:');
        console.log(`  • Total notes: ${stats.notes?.toLocaleString() || 'N/A'}`);
        console.log(`  • Total branches: ${stats.branches?.toLocaleString() || 'N/A'}`);
        console.log(`  • Total attributes: ${stats.attributes?.toLocaleString() || 'N/A'}`);
        console.log(`  • Total revisions: ${stats.revisions?.toLocaleString() || 'N/A'}`);
        console.log(`  • Total attachments: ${stats.attachments?.toLocaleString() || 'N/A'}`);
        console.log(`  • Recent notes: ${stats.recentNotes?.toLocaleString() || 'N/A'}`);
        console.log(`  • Time taken: ${duration.toFixed(2)} seconds`);
        console.log(`  • Average rate: ${Math.round(noteCount / duration).toLocaleString()} notes/second`);
        console.log(`  • Container note ID: ${containerNote.noteId}\n`);
        
    } catch (error) {
        console.error('\n❌ Stress test failed with error:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        exitCode = 1;
    } finally {
        // Cleanup database connections and resources
        console.log('\nCleaning up database resources...');
        try {
            // Close any open database connections
            if (sql && typeof sql.execute === 'function') {
                // Try to checkpoint WAL if possible
                try {
                    sql.execute('PRAGMA wal_checkpoint(TRUNCATE)');
                    console.log('WAL checkpoint completed');
                } catch (e) {
                    // Ignore checkpoint errors
                }
            }
        } catch (error) {
            console.warn('Error during database cleanup:', error);
        }
        
        // Perform final resource cleanup
        await resourceManager.cleanup();
        
        // Exit with appropriate code
        console.log(`Exiting with code: ${exitCode}`);
        process.exit(exitCode);
    }
}

async function start(): Promise<void> {
    try {
        // Register database cleanup
        resourceManager.register('Database Connection', async () => {
            try {
                if (sql && typeof sql.execute === 'function') {
                    console.log('Closing database connections...');
                    // Attempt to close any open transactions
                    sql.execute('ROLLBACK');
                }
            } catch (e) {
                // Ignore errors during cleanup
            }
        });
        
        // Run the stress test
        await runStressTest();
    } catch (error) {
        console.error('Fatal error during startup:', error);
        await resourceManager.cleanup();
        process.exit(1);
    }
}

// Initialize database and run stress test
sqlInit.dbReady
    .then(() => cls.wrap(start)())
    .catch(async (err) => {
        console.error('Failed to initialize database:', err);
        await resourceManager.cleanup();
        process.exit(1);
    });