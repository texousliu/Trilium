"use strict";

import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import log from "./log.js";
import becca from "../becca/becca.js";
import BNote from "../becca/entities/bnote.js";
import BFileSystemMapping from "../becca/entities/bfile_system_mapping.js";
import BFileNoteMapping from "../becca/entities/bfile_note_mapping.js";
import BAttribute from "../becca/entities/battribute.js";
import BBranch from "../becca/entities/bbranch.js";
import fileSystemContentConverter from "./file_system_content_converter.js";
import fileSystemWatcher from "./file_system_watcher.js";
import eventService from "./events.js";
import noteService from "./notes.js";

export interface SyncResult {
    success: boolean;
    message?: string;
    conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
    type: 'content' | 'structure' | 'metadata';
    filePath: string;
    noteId: string;
    fileModified: string;
    noteModified: string;
    description: string;
}

export interface SyncStats {
    filesProcessed: number;
    notesCreated: number;
    notesUpdated: number;
    filesCreated: number;
    filesUpdated: number;
    conflicts: number;
    errors: number;
}

/**
 * Bidirectional sync engine between Trilium notes and file system
 */
class FileSystemSync {
    private isInitialized = false;
    private syncInProgress = new Set<string>(); // Track ongoing syncs by mapping ID

    constructor() {
        this.setupEventHandlers();
    }

    /**
     * Initialize the sync engine
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        log.info('Initializing file system sync engine...');

        // Initialize file system watcher
        await fileSystemWatcher.init();

        this.isInitialized = true;
        log.info('File system sync engine initialized');
    }

    /**
     * Shutdown the sync engine
     */
    async shutdown() {
        if (!this.isInitialized) {
            return;
        }

        log.info('Shutting down file system sync engine...');

        await fileSystemWatcher.shutdown();

        this.isInitialized = false;
        log.info('File system sync engine shutdown complete');
    }

    /**
     * Setup event handlers for file changes and note changes
     */
    private setupEventHandlers() {
        // Handle file changes from watcher
        eventService.subscribe('FILE_CHANGED', async ({ fileNoteMapping, mapping, fileContent, isNew }) => {
            await this.handleFileChanged(fileNoteMapping, mapping, fileContent, isNew);
        });

        eventService.subscribe('FILE_DELETED', async ({ fileNoteMapping, mapping }) => {
            await this.handleFileDeleted(fileNoteMapping, mapping);
        });

        // Handle note changes
        eventService.subscribe(eventService.NOTE_CONTENT_CHANGE, async ({ entity: note }) => {
            await this.handleNoteChanged(note as BNote);
        });

        eventService.subscribe(eventService.ENTITY_CHANGED, async ({ entityName, entity }) => {
            if (entityName === 'notes') {
                await this.handleNoteChanged(entity as BNote);
            }
        });

        eventService.subscribe(eventService.ENTITY_DELETED, async ({ entityName, entityId }) => {
            if (entityName === 'notes') {
                await this.handleNoteDeleted(entityId);
            }
        });
    }

    /**
     * Perform full sync for a specific mapping
     */
    async fullSync(mappingId: string): Promise<SyncResult> {
        const mapping = becca.fileSystemMappings[mappingId];
        if (!mapping) {
            return { success: false, message: `Mapping ${mappingId} not found` };
        }

        if (this.syncInProgress.has(mappingId)) {
            return { success: false, message: 'Sync already in progress for this mapping' };
        }

        this.syncInProgress.add(mappingId);
        const stats: SyncStats = {
            filesProcessed: 0,
            notesCreated: 0,
            notesUpdated: 0,
            filesCreated: 0,
            filesUpdated: 0,
            conflicts: 0,
            errors: 0
        };

        try {
            log.info(`Starting full sync for mapping ${mappingId}: ${mapping.filePath}`);

            if (!await fs.pathExists(mapping.filePath)) {
                throw new Error(`Path does not exist: ${mapping.filePath}`);
            }

            const pathStats = await fs.stat(mapping.filePath);

            if (pathStats.isFile()) {
                await this.syncSingleFile(mapping, mapping.filePath, stats);
            } else if (pathStats.isDirectory()) {
                await this.syncDirectory(mapping, mapping.filePath, stats);
            }

            // Reverse sync: export notes that don't have corresponding files
            if (mapping.canSyncToDisk) {
                await this.syncNotesToFiles(mapping, stats);
            }

            mapping.updateLastSyncTime();
            mapping.clearSyncErrors();

            log.info(`Full sync completed for mapping ${mappingId}. Stats: ${JSON.stringify(stats)}`);
            return { success: true, message: `Sync completed successfully. ${stats.filesProcessed} files processed.` };

        } catch (error) {
            const errorMsg = `Full sync failed for mapping ${mappingId}: ${(error as Error).message}`;
            log.error(errorMsg);
            mapping.addSyncError(errorMsg);
            stats.errors++;
            return { success: false, message: errorMsg };
        } finally {
            this.syncInProgress.delete(mappingId);
        }
    }

    /**
     * Sync a single file
     */
    private async syncSingleFile(mapping: BFileSystemMapping, filePath: string, stats: SyncStats) {
        if (!fileSystemContentConverter.isSupportedFileType(filePath)) {
            log.info(`DEBUG: Skipping unsupported file type: ${filePath}`);
            return;
        }

        stats.filesProcessed++;

        // Check if file note mapping exists
        let fileNoteMapping = this.findFileNoteMappingByPath(mapping.mappingId, filePath);

        if (fileNoteMapping) {
            await this.syncExistingFile(mapping, fileNoteMapping, stats);
        } else {
            await this.syncNewFile(mapping, filePath, stats);
        }
    }

    /**
     * Sync a directory recursively
     */
    private async syncDirectory(mapping: BFileSystemMapping, dirPath: string, stats: SyncStats) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Skip excluded patterns
            if (this.isPathExcluded(fullPath, mapping)) {
                continue;
            }

            if (entry.isFile()) {
                await this.syncSingleFile(mapping, fullPath, stats);
            } else if (entry.isDirectory() && mapping.includeSubtree) {
                await this.syncDirectory(mapping, fullPath, stats);
            }
        }
    }

    /**
     * Sync notes to files (reverse sync) - export notes that don't have corresponding files
     */
    private async syncNotesToFiles(mapping: BFileSystemMapping, stats: SyncStats) {
        const rootNote = mapping.getNote();
        
        // Sync the root note itself if it's mapped to a file
        const pathStats = await fs.stat(mapping.filePath);
        if (pathStats.isFile()) {
            await this.syncNoteToFile(mapping, rootNote, mapping.filePath, stats);
        } else {
            // Sync child notes in the subtree
            await this.syncNoteSubtreeToFiles(mapping, rootNote, mapping.filePath, stats);
        }
    }

    /**
     * Sync a note subtree to files recursively
     */
    private async syncNoteSubtreeToFiles(mapping: BFileSystemMapping, note: BNote, basePath: string, stats: SyncStats) {
        for (const childBranch of note.children) {
            const childNote = becca.notes[childBranch.noteId];
            if (!childNote) continue;

            // Skip system notes and other special notes
            if (childNote.noteId.startsWith('_') || childNote.type === 'book') {
                if (mapping.includeSubtree) {
                    // For book notes, recurse into children but don't create a file
                    await this.syncNoteSubtreeToFiles(mapping, childNote, basePath, stats);
                }
                continue;
            }

            // Generate file path for this note
            const fileExtension = this.getFileExtensionForNote(childNote, mapping);
            const fileName = this.sanitizeFileName(childNote.title) + fileExtension;
            const filePath = path.join(basePath, fileName);

            // Check if file already exists or has a mapping
            const existingMapping = this.findFileNoteMappingByNote(mapping.mappingId, childNote.noteId);
            
            if (!existingMapping && !await fs.pathExists(filePath)) {
                // Note doesn't have a file mapping and file doesn't exist - create it
                await this.syncNoteToFile(mapping, childNote, filePath, stats);
            }

            // Recurse into children if includeSubtree is enabled
            if (mapping.includeSubtree && childNote.children.length > 0) {
                const childDir = path.join(basePath, this.sanitizeFileName(childNote.title));
                await fs.ensureDir(childDir);
                await this.syncNoteSubtreeToFiles(mapping, childNote, childDir, stats);
            }
        }
    }

    /**
     * Sync a single note to a file
     */
    private async syncNoteToFile(mapping: BFileSystemMapping, note: BNote, filePath: string, stats: SyncStats) {
        try {
            // Convert note content to file format
            const conversion = await fileSystemContentConverter.noteToFile(note, mapping, filePath, {
                preserveAttributes: true,
                includeFrontmatter: true
            });

            // Ensure directory exists
            await fs.ensureDir(path.dirname(filePath));

            // Write file
            await fs.writeFile(filePath, conversion.content);

            // Calculate file hash and get modification time
            const fileStats = await fs.stat(filePath);
            const fileHash = await this.calculateFileHash(filePath);

            // Create file note mapping
            const fileNoteMapping = new BFileNoteMapping({
                mappingId: mapping.mappingId,
                noteId: note.noteId,
                filePath,
                fileHash,
                fileModifiedTime: fileStats.mtime.toISOString(),
                syncStatus: 'synced'
            }).save();

            stats.filesCreated++;
            log.info(`Created file ${filePath} from note ${note.noteId}`);

        } catch (error) {
            log.error(`Error creating file from note ${note.noteId}: ${error}`);
            mapping.addSyncError(`Error creating file from note ${note.noteId}: ${(error as Error).message}`);
            stats.errors++;
        }
    }

    /**
     * Sync an existing file that has a note mapping
     */
    private async syncExistingFile(mapping: BFileSystemMapping, fileNoteMapping: BFileNoteMapping, stats: SyncStats) {
        const filePath = fileNoteMapping.filePath;

        if (!await fs.pathExists(filePath)) {
            // File was deleted
            if (mapping.canSyncFromDisk) {
                await this.deleteNoteFromFileMapping(fileNoteMapping, stats);
            }
            return;
        }

        const fileStats = await fs.stat(filePath);
        const fileHash = await this.calculateFileHash(filePath);
        const fileModifiedTime = fileStats.mtime.toISOString();

        const note = fileNoteMapping.note;
        if (!note) {
            log.info(`Note not found for file mapping: ${fileNoteMapping.noteId}`);
            return;
        }

        const fileChanged = fileNoteMapping.hasFileChanged(fileHash, fileModifiedTime);
        const noteChanged = fileNoteMapping.hasNoteChanged();

        if (!fileChanged && !noteChanged) {
            // No changes
            return;
        }

        if (fileChanged && noteChanged) {
            // Conflict - both changed
            fileNoteMapping.markConflict();
            stats.conflicts++;
            log.info(`Conflict detected for ${filePath} - both file and note modified`);
            return;
        }

        if (fileChanged && mapping.canSyncFromDisk) {
            // Update note from file
            await this.updateNoteFromFile(mapping, fileNoteMapping, fileHash, fileModifiedTime, stats);
        } else if (noteChanged && mapping.canSyncToDisk) {
            // Update file from note
            await this.updateFileFromNote(mapping, fileNoteMapping, fileHash, fileModifiedTime, stats);
        }
    }

    /**
     * Sync a new file that doesn't have a note mapping
     */
    private async syncNewFile(mapping: BFileSystemMapping, filePath: string, stats: SyncStats) {
        if (!mapping.canSyncFromDisk) {
            return;
        }

        try {
            const fileStats = await fs.stat(filePath);
            const fileHash = await this.calculateFileHash(filePath);
            const fileModifiedTime = fileStats.mtime.toISOString();

            // Create note from file
            const note = await this.createNoteFromFile(mapping, filePath);

            // Create file note mapping
            const fileNoteMapping = new BFileNoteMapping({
                mappingId: mapping.mappingId,
                noteId: note.noteId,
                filePath,
                fileHash,
                fileModifiedTime,
                syncStatus: 'synced'
            }).save();

            stats.notesCreated++;
            log.info(`Created note ${note.noteId} from file ${filePath}`);

        } catch (error) {
            log.error(`Error creating note from file ${filePath}: ${error}`);
            mapping.addSyncError(`Error creating note from file ${filePath}: ${(error as Error).message}`);
            stats.errors++;
        }
    }

    /**
     * Create a new note from a file
     */
    private async createNoteFromFile(mapping: BFileSystemMapping, filePath: string): Promise<BNote> {
        const fileContent = await fs.readFile(filePath);
        const fileName = path.basename(filePath, path.extname(filePath));

        // Convert file content to note format
        const conversion = await fileSystemContentConverter.fileToNote(fileContent, mapping, filePath, {
            preserveAttributes: true,
            includeFrontmatter: true
        });

        // Determine parent note
        const parentNote = this.getParentNoteForFile(mapping, filePath);

        // Create the note
        const note = new BNote({
            title: fileName,
            type: conversion.type || 'text',
            mime: conversion.mime || 'text/html'
        }).save();

        // Set content
        note.setContent(conversion.content);

        // Create branch
        new BBranch({
            noteId: note.noteId,
            parentNoteId: parentNote.noteId
        }).save();

        // Add attributes from conversion
        if (conversion.attributes) {
            for (const attr of conversion.attributes) {
                new BAttribute({
                    noteId: note.noteId,
                    type: attr.type,
                    name: attr.name,
                    value: attr.value,
                    isInheritable: attr.isInheritable || false
                }).save();
            }
        }

        return note;
    }

    /**
     * Update note content from file
     */
    private async updateNoteFromFile(mapping: BFileSystemMapping, fileNoteMapping: BFileNoteMapping, fileHash: string, fileModifiedTime: string, stats: SyncStats) {
        try {
            const note = fileNoteMapping.getNote();
            const fileContent = await fs.readFile(fileNoteMapping.filePath);

            // Convert file content to note format
            const conversion = await fileSystemContentConverter.fileToNote(fileContent, mapping, fileNoteMapping.filePath, {
                preserveAttributes: true,
                includeFrontmatter: true
            });

            // Update note content
            note.setContent(conversion.content);

            // Update note type/mime if they changed
            if (conversion.type && conversion.type !== note.type) {
                note.type = conversion.type as any;
                note.save();
            }
            if (conversion.mime && conversion.mime !== note.mime) {
                note.mime = conversion.mime;
                note.save();
            }

            // Update attributes if needed
            if (conversion.attributes) {
                // Remove existing attributes that came from file
                const existingAttrs = note.getOwnedAttributes();
                for (const attr of existingAttrs) {
                    if (attr.name.startsWith('_fileSync_')) {
                        attr.markAsDeleted();
                    }
                }

                // Add new attributes
                for (const attr of conversion.attributes) {
                    new BAttribute({
                        noteId: note.noteId,
                        type: attr.type,
                        name: attr.name,
                        value: attr.value,
                        isInheritable: attr.isInheritable || false
                    }).save();
                }
            }

            fileNoteMapping.markSynced(fileHash, fileModifiedTime);
            stats.notesUpdated++;

            log.info(`DEBUG: Updated note ${note.noteId} from file ${fileNoteMapping.filePath}`);

        } catch (error) {
            log.error(`Error updating note from file ${fileNoteMapping.filePath}: ${error}`);
            fileNoteMapping.markError();
            mapping.addSyncError(`Error updating note from file: ${(error as Error).message}`);
            stats.errors++;
        }
    }

    /**
     * Update file content from note
     */
    private async updateFileFromNote(mapping: BFileSystemMapping, fileNoteMapping: BFileNoteMapping, currentFileHash: string, currentModifiedTime: string, stats: SyncStats) {
        try {
            const note = fileNoteMapping.getNote();

            // Convert note content to file format
            const conversion = await fileSystemContentConverter.noteToFile(note, mapping, fileNoteMapping.filePath, {
                preserveAttributes: true,
                includeFrontmatter: true
            });

            // Ensure directory exists
            await fs.ensureDir(path.dirname(fileNoteMapping.filePath));

            // Write file
            await fs.writeFile(fileNoteMapping.filePath, conversion.content);

            // Update file note mapping with new file info
            const newStats = await fs.stat(fileNoteMapping.filePath);
            const newFileHash = await this.calculateFileHash(fileNoteMapping.filePath);

            fileNoteMapping.markSynced(newFileHash, newStats.mtime.toISOString());
            stats.filesUpdated++;

            log.info(`DEBUG: Updated file ${fileNoteMapping.filePath} from note ${note.noteId}`);

        } catch (error) {
            log.error(`Error updating file from note ${fileNoteMapping.noteId}: ${error}`);
            fileNoteMapping.markError();
            mapping.addSyncError(`Error updating file from note: ${(error as Error).message}`);
            stats.errors++;
        }
    }

    /**
     * Handle file change event from watcher
     */
    private async handleFileChanged(fileNoteMapping: BFileNoteMapping, mapping: BFileSystemMapping, fileContent: Buffer, isNew: boolean) {
        if (this.syncInProgress.has(mapping.mappingId)) {
            return; // Skip if full sync in progress
        }

        const stats: SyncStats = {
            filesProcessed: 1,
            notesCreated: 0,
            notesUpdated: 0,
            filesCreated: 0,
            filesUpdated: 0,
            conflicts: 0,
            errors: 0
        };

        if (isNew) {
            await this.syncNewFile(mapping, fileNoteMapping.filePath, stats);
        } else {
            const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
            const fileStats = await fs.stat(fileNoteMapping.filePath);
            const fileModifiedTime = fileStats.mtime.toISOString();

            await this.syncExistingFile(mapping, fileNoteMapping, stats);
        }
    }

    /**
     * Handle file deletion event from watcher
     */
    private async handleFileDeleted(fileNoteMapping: BFileNoteMapping, mapping: BFileSystemMapping) {
        if (this.syncInProgress.has(mapping.mappingId)) {
            return; // Skip if full sync in progress
        }

        const stats: SyncStats = {
            filesProcessed: 0,
            notesCreated: 0,
            notesUpdated: 0,
            filesCreated: 0,
            filesUpdated: 0,
            conflicts: 0,
            errors: 0
        };

        await this.deleteNoteFromFileMapping(fileNoteMapping, stats);
    }

    /**
     * Handle note change event
     */
    private async handleNoteChanged(note: BNote) {
        // Find all file mappings for this note
        const fileMappings = this.findFileNoteMappingsByNote(note.noteId);

        for (const fileMapping of fileMappings) {
            const mapping = fileMapping.mapping;
            if (!mapping || !mapping.canSyncToDisk || this.syncInProgress.has(mapping.mappingId)) {
                continue;
            }

            // Check if note was actually modified since last sync
            if (!fileMapping.hasNoteChanged()) {
                continue;
            }

            const stats: SyncStats = {
                filesProcessed: 0,
                notesCreated: 0,
                notesUpdated: 0,
                filesCreated: 0,
                filesUpdated: 0,
                conflicts: 0,
                errors: 0
            };

            // Check for conflicts
            if (await fs.pathExists(fileMapping.filePath)) {
                const fileStats = await fs.stat(fileMapping.filePath);
                const fileHash = await this.calculateFileHash(fileMapping.filePath);
                const fileModifiedTime = fileStats.mtime.toISOString();

                if (fileMapping.hasFileChanged(fileHash, fileModifiedTime)) {
                    // Conflict
                    fileMapping.markConflict();
                    log.info(`Conflict detected for note ${note.noteId} - both file and note modified`);
                    continue;
                }
            }

            // Update file from note
            const currentFileHash = await this.calculateFileHash(fileMapping.filePath);
            const currentModifiedTime = (await fs.stat(fileMapping.filePath)).mtime.toISOString();

            await this.updateFileFromNote(mapping, fileMapping, currentFileHash, currentModifiedTime, stats);
        }
    }

    /**
     * Handle note deletion event
     */
    private async handleNoteDeleted(noteId: string) {
        // Find all file mappings for this note
        const fileMappings = this.findFileNoteMappingsByNote(noteId);

        for (const fileMapping of fileMappings) {
            const mapping = fileMapping.mapping;
            if (!mapping || !mapping.canSyncToDisk || this.syncInProgress.has(mapping.mappingId)) {
                continue;
            }

            try {
                // Delete the file
                if (await fs.pathExists(fileMapping.filePath)) {
                    await fs.remove(fileMapping.filePath);
                    log.info(`Deleted file ${fileMapping.filePath} for deleted note ${noteId}`);
                }

                // Delete the mapping
                fileMapping.markAsDeleted();

            } catch (error) {
                log.error(`Error deleting file for note ${noteId}: ${error}`);
                mapping.addSyncError(`Error deleting file: ${(error as Error).message}`);
            }
        }
    }

    /**
     * Delete note when file is deleted
     */
    private async deleteNoteFromFileMapping(fileNoteMapping: BFileNoteMapping, stats: SyncStats) {
        try {
            const note = fileNoteMapping.note;
            if (note) {
                note.deleteNote();
                log.info(`Deleted note ${note.noteId} for deleted file ${fileNoteMapping.filePath}`);
            }

            // Delete the mapping
            fileNoteMapping.markAsDeleted();

        } catch (error) {
            log.error(`Error deleting note for file ${fileNoteMapping.filePath}: ${error}`);
            stats.errors++;
        }
    }

    /**
     * Get parent note for a file based on mapping configuration
     */
    private getParentNoteForFile(mapping: BFileSystemMapping, filePath: string): BNote {
        const mappedNote = mapping.getNote();

        if (!mapping.preserveHierarchy || !mapping.includeSubtree) {
            return mappedNote;
        }

        // Calculate relative path from mapping root
        const relativePath = path.relative(mapping.filePath, path.dirname(filePath));

        if (!relativePath || relativePath === '.') {
            return mappedNote;
        }

        // Create directory structure as notes
        const pathParts = relativePath.split(path.sep);
        let currentParent = mappedNote;

        for (const part of pathParts) {
            if (!part) continue;

            // Look for existing child note with this name
            let childNote = currentParent.children.find(child => child.title === part);

            if (!childNote) {
                // Create new note for this directory
                childNote = new BNote({
                    title: part,
                    type: 'text',
                    mime: 'text/html'
                }).save();

                childNote.setContent('<p>Directory note</p>');

                // Create branch (notePosition will be auto-calculated)
                new BBranch({
                    noteId: childNote.noteId,
                    parentNoteId: currentParent.noteId
                }).save();
            }

            currentParent = childNote;
        }

        return currentParent;
    }

    /**
     * Calculate SHA256 hash of a file
     */
    private async calculateFileHash(filePath: string): Promise<string> {
        const content = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Check if a path should be excluded based on mapping patterns
     */
    private isPathExcluded(filePath: string, mapping: BFileSystemMapping): boolean {
        if (!mapping.excludePatterns) {
            return false;
        }

        const normalizedPath = path.normalize(filePath);
        const basename = path.basename(normalizedPath);

        for (const pattern of mapping.excludePatterns) {
            if (typeof pattern === 'string') {
                // Simple string matching
                if (normalizedPath.includes(pattern) || basename.includes(pattern)) {
                    return true;
                }
            } else if (pattern instanceof RegExp) {
                // Regex pattern
                if (pattern.test(normalizedPath) || pattern.test(basename)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Find file note mapping by file path
     */
    private findFileNoteMappingByPath(mappingId: string, filePath: string): BFileNoteMapping | null {
        const normalizedPath = path.normalize(filePath);

        for (const mapping of Object.values(becca.fileNoteMappings || {})) {
            if (mapping.mappingId === mappingId && path.normalize(mapping.filePath) === normalizedPath) {
                return mapping;
            }
        }

        return null;
    }

    /**
     * Find all file note mappings for a note
     */
    private findFileNoteMappingsByNote(noteId: string): BFileNoteMapping[] {
        const mappings: BFileNoteMapping[] = [];

        for (const mapping of Object.values(becca.fileNoteMappings || {})) {
            if (mapping.noteId === noteId) {
                mappings.push(mapping);
            }
        }

        return mappings;
    }

    /**
     * Find file note mapping by note ID within a specific mapping
     */
    private findFileNoteMappingByNote(mappingId: string, noteId: string): BFileNoteMapping | null {
        for (const mapping of Object.values(becca.fileNoteMappings || {})) {
            if (mapping.mappingId === mappingId && mapping.noteId === noteId) {
                return mapping;
            }
        }

        return null;
    }

    /**
     * Get appropriate file extension for a note based on its type and mapping configuration
     */
    private getFileExtensionForNote(note: BNote, mapping: BFileSystemMapping): string {
        const contentFormat = mapping.contentFormat;

        if (contentFormat === 'markdown' || (contentFormat === 'auto' && note.type === 'text')) {
            return '.md';
        } else if (contentFormat === 'html' || (contentFormat === 'auto' && note.type === 'text' && note.mime === 'text/html')) {
            return '.html';
        } else if (note.type === 'code') {
            // Map MIME types to file extensions
            const mimeToExt: Record<string, string> = {
                'application/javascript': '.js',
                'text/javascript': '.js',
                'application/typescript': '.ts',
                'text/typescript': '.ts',
                'application/json': '.json',
                'text/css': '.css',
                'text/x-python': '.py',
                'text/x-java': '.java',
                'text/x-csharp': '.cs',
                'text/x-sql': '.sql',
                'text/x-sh': '.sh',
                'text/x-yaml': '.yaml',
                'application/xml': '.xml',
                'text/xml': '.xml'
            };
            return mimeToExt[note.mime] || '.txt';
        } else if (note.type === 'image') {
            const mimeToExt: Record<string, string> = {
                'image/png': '.png',
                'image/jpeg': '.jpg',
                'image/gif': '.gif',
                'image/svg+xml': '.svg'
            };
            return mimeToExt[note.mime] || '.png';
        } else {
            return '.txt';
        }
    }

    /**
     * Sanitize file name to be safe for file system
     */
    private sanitizeFileName(fileName: string): string {
        // Replace invalid characters with underscores
        return fileName
            .replace(/[<>:"/\\|?*]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '')
            .substring(0, 100); // Limit length
    }

    /**
     * Get sync status for all mappings
     */
    getSyncStatus() {
        const status: Record<string, any> = {};

        for (const mapping of Object.values(becca.fileSystemMappings || {})) {
            const fileMappings = Object.values(becca.fileNoteMappings || {})
                .filter(fm => fm.mappingId === mapping.mappingId);

            const conflicts = fileMappings.filter(fm => fm.syncStatus === 'conflict').length;
            const pending = fileMappings.filter(fm => fm.syncStatus === 'pending').length;
            const errors = fileMappings.filter(fm => fm.syncStatus === 'error').length;

            status[mapping.mappingId] = {
                filePath: mapping.filePath,
                isActive: mapping.isActive,
                syncDirection: mapping.syncDirection,
                fileCount: fileMappings.length,
                conflicts,
                pending,
                errors,
                lastSyncTime: mapping.lastSyncTime,
                syncErrors: mapping.syncErrors,
                isRunning: this.syncInProgress.has(mapping.mappingId)
            };
        }

        return status;
    }
}

// Create singleton instance
const fileSystemSync = new FileSystemSync();

export default fileSystemSync;
