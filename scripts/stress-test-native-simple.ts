#!/usr/bin/env tsx
/**
 * Native API Stress Test Utility (Simplified)
 * Uses Trilium's native services to create notes without complex dependencies
 * 
 * Usage: DATA_DIR=apps/server/data pnpm tsx scripts/stress-test-native-simple.ts <number-of-notes> [batch-size]
 * 
 * Example:
 *   DATA_DIR=apps/server/data pnpm tsx scripts/stress-test-native-simple.ts 10000
 *   DATA_DIR=apps/server/data pnpm tsx scripts/stress-test-native-simple.ts 1000 100
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

const noteCount = parseInt(process.argv[2]);
const batchSize = parseInt(process.argv[3]) || 100;

if (!noteCount || noteCount < 1) {
    console.error(`Please enter number of notes as program parameter.`);
    console.error(`Usage: DATA_DIR=apps/server/data pnpm tsx scripts/stress-test-native-simple.ts <number-of-notes> [batch-size]`);
    process.exit(1);
}

// Set up database path
const DATA_DIR = process.env.DATA_DIR || 'apps/server/data';
const DB_PATH = path.join(DATA_DIR, 'document.db');

if (!fs.existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}`);
    console.error('Please ensure the server has been run at least once to create the database.');
    process.exit(1);
}

console.log(`\n🚀 Trilium Native-Style Stress Test Utility`);
console.log(`============================================`);
console.log(`  Notes to create: ${noteCount.toLocaleString()}`);
console.log(`  Batch size: ${batchSize.toLocaleString()}`);
console.log(`  Database: ${DB_PATH}`);
console.log(`============================================\n`);

// Open database
const db = new Database(DB_PATH);

// Enable optimizations
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');

// Helper functions that mimic Trilium's ID generation
function newEntityId(prefix: string = ''): string {
    return prefix + randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 12);
}

function utcNowDateTime(): string {
    return new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

// Word lists for content generation
const words = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud'
];

const titleTemplates = [
    'Project ${word1} ${word2}',
    'Meeting Notes: ${word1} ${word2}',
    'TODO: ${word1} ${word2} ${word3}',
    'Research on ${word1} and ${word2}',
    'Analysis of ${word1} ${word2}'
];

const attributeNames = [
    'archived', 'hideInNote', 'readOnly', 'cssClass', 'iconClass',
    'pageSize', 'viewType', 'template', 'widget', 'index',
    'label', 'promoted', 'hideChildrenOverview', 'collapsed'
];

const noteTypes = ['text', 'code', 'book', 'render', 'canvas', 'mermaid', 'search'];

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

function generateContent(): string {
    const paragraphCount = Math.floor(Math.random() * 5) + 1;
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

// Native-style service functions
function createNote(params: {
    noteId: string;
    title: string;
    content: string;
    type: string;
    mime?: string;
    isProtected?: boolean;
    parentNoteId?: string;
}) {
    const currentDateTime = utcNowDateTime();
    const noteStmt = db.prepare(`
        INSERT INTO notes (noteId, title, isProtected, type, mime, blobId, isDeleted, deleteId, 
                          dateCreated, dateModified, utcDateCreated, utcDateModified) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const blobStmt = db.prepare(`
        INSERT INTO blobs (blobId, content, dateModified, utcDateModified) 
        VALUES (?, ?, ?, ?)
    `);
    
    const branchStmt = db.prepare(`
        INSERT INTO branches (branchId, noteId, parentNoteId, notePosition, prefix, 
                             isExpanded, isDeleted, deleteId, utcDateModified) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Create blob
    const blobId = newEntityId();
    blobStmt.run(
        blobId,
        Buffer.from(params.content, 'utf-8'),
        currentDateTime,
        currentDateTime
    );
    
    // Create note
    noteStmt.run(
        params.noteId,
        params.title,
        params.isProtected ? 1 : 0,
        params.type,
        params.mime || (params.type === 'code' ? 'text/plain' : 'text/html'),
        blobId,
        0,
        null,
        currentDateTime,
        currentDateTime,
        currentDateTime,
        currentDateTime
    );
    
    // Create branch if parent specified
    if (params.parentNoteId) {
        branchStmt.run(
            newEntityId(),
            params.noteId,
            params.parentNoteId,
            Math.floor(Math.random() * 1000),
            null,
            0,
            0,
            null,
            currentDateTime
        );
    }
    
    return params.noteId;
}

function createAttribute(params: {
    noteId: string;
    type: 'label' | 'relation';
    name: string;
    value: string;
    isInheritable?: boolean;
}) {
    const currentDateTime = utcNowDateTime();
    const stmt = db.prepare(`
        INSERT INTO attributes (attributeId, noteId, type, name, value, position, 
                               utcDateModified, isDeleted, deleteId, isInheritable) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
        newEntityId(),
        params.noteId,
        params.type,
        params.name,
        params.value,
        0,
        currentDateTime,
        0,
        null,
        params.isInheritable ? 1 : 0
    );
}

async function main() {
    const startTime = Date.now();
    const allNoteIds: string[] = ['root'];
    let notesCreated = 0;
    let attributesCreated = 0;
    
    console.log('Starting note generation...\n');
    
    // Create container note
    const containerNoteId = newEntityId();
    const containerTransaction = db.transaction(() => {
        createNote({
            noteId: containerNoteId,
            title: `Stress Test ${new Date().toISOString()}`,
            content: `<p>Container for stress test with ${noteCount} notes</p>`,
            type: 'text',
            parentNoteId: 'root'
        });
    });
    containerTransaction();
    
    console.log(`Created container note: ${containerNoteId}`);
    allNoteIds.push(containerNoteId);
    
    // Process in batches
    for (let batch = 0; batch < Math.ceil(noteCount / batchSize); batch++) {
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, noteCount);
        const batchNoteCount = batchEnd - batchStart;
        
        const batchTransaction = db.transaction(() => {
            for (let i = 0; i < batchNoteCount; i++) {
                const noteId = newEntityId();
                const type = noteTypes[Math.floor(Math.random() * noteTypes.length)];
                
                // Decide parent - either container or random existing note
                let parentNoteId = containerNoteId;
                if (allNoteIds.length > 10 && Math.random() < 0.3) {
                    parentNoteId = allNoteIds[Math.floor(Math.random() * Math.min(allNoteIds.length, 100))];
                }
                
                // Create note
                createNote({
                    noteId,
                    title: generateTitle(),
                    content: generateContent(),
                    type,
                    parentNoteId,
                    isProtected: Math.random() < 0.05
                });
                
                notesCreated++;
                allNoteIds.push(noteId);
                
                // Add attributes
                const attributeCount = Math.floor(Math.random() * 5);
                for (let a = 0; a < attributeCount; a++) {
                    const attrType = Math.random() < 0.7 ? 'label' : 'relation';
                    const attrName = attributeNames[Math.floor(Math.random() * attributeNames.length)];
                    
                    try {
                        createAttribute({
                            noteId,
                            type: attrType,
                            name: attrName,
                            value: attrType === 'relation' 
                                ? allNoteIds[Math.floor(Math.random() * Math.min(allNoteIds.length, 50))]
                                : getRandomWord(),
                            isInheritable: Math.random() < 0.2
                        });
                        attributesCreated++;
                    } catch (e) {
                        // Ignore duplicate errors
                    }
                }
                
                // Keep memory in check
                if (allNoteIds.length > 500) {
                    allNoteIds.splice(1, allNoteIds.length - 500);
                }
            }
        });
        
        batchTransaction();
        
        const progress = Math.round(((batch + 1) / Math.ceil(noteCount / batchSize)) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = Math.round(notesCreated / elapsed);
        
        console.log(`Progress: ${progress}% | Notes: ${notesCreated}/${noteCount} | Rate: ${rate}/sec | Attributes: ${attributesCreated}`);
    }
    
    // Add entity changes
    console.log('\nAdding entity changes...');
    const entityTransaction = db.transaction(() => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO entity_changes 
            (entityName, entityId, hash, isErased, changeId, componentId, instanceId, isSynced, utcDateChanged) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (let i = 0; i < Math.min(100, allNoteIds.length); i++) {
            stmt.run(
                'notes',
                allNoteIds[i],
                randomBytes(16).toString('hex'),
                0,
                newEntityId(),
                'stress_test',
                'stress_test_instance',
                1,
                utcNowDateTime()
            );
        }
    });
    entityTransaction();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Get statistics
    const stats = {
        notes: db.prepare('SELECT COUNT(*) as count FROM notes').get() as any,
        branches: db.prepare('SELECT COUNT(*) as count FROM branches').get() as any,
        attributes: db.prepare('SELECT COUNT(*) as count FROM attributes').get() as any,
        blobs: db.prepare('SELECT COUNT(*) as count FROM blobs').get() as any
    };
    
    console.log('\n✅ Native-style stress test completed successfully!\n');
    console.log('Database Statistics:');
    console.log(`  • Total notes: ${stats.notes.count.toLocaleString()}`);
    console.log(`  • Total branches: ${stats.branches.count.toLocaleString()}`);
    console.log(`  • Total attributes: ${stats.attributes.count.toLocaleString()}`);
    console.log(`  • Total blobs: ${stats.blobs.count.toLocaleString()}`);
    console.log(`  • Time taken: ${duration.toFixed(2)} seconds`);
    console.log(`  • Average rate: ${Math.round(noteCount / duration).toLocaleString()} notes/second`);
    console.log(`  • Container note ID: ${containerNoteId}\n`);
    
    db.close();
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});