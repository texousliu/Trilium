"use strict";

import chokidar from "chokidar";
import path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import debounce from "debounce";
import log from "./log.js";
import becca from "../becca/becca.js";
import BFileSystemMapping from "../becca/entities/bfile_system_mapping.js";
import BFileNoteMapping from "../becca/entities/bfile_note_mapping.js";
import eventService from "./events.js";
import { newEntityId } from "./utils.js";
import type { FSWatcher } from "chokidar";

interface WatchedMapping {
    mapping: BFileSystemMapping;
    watcher: FSWatcher;
}

interface FileChangeEvent {
    type: 'add' | 'change' | 'unlink';
    filePath: string;
    mappingId: string;
    stats?: fs.Stats;
}

class FileSystemWatcher {
    private watchers: Map<string, WatchedMapping> = new Map();
    private syncQueue: FileChangeEvent[] = [];
    private isProcessing = false;

    // Debounced sync to batch multiple file changes
    private processSyncQueue = debounce(this._processSyncQueue.bind(this), 500);

    constructor() {
        // Subscribe to entity changes to watch for new/updated/deleted mappings
        eventService.subscribe(eventService.ENTITY_CREATED, ({ entityName, entity }) => {
            if (entityName === 'file_system_mappings') {
                this.addWatcher(entity as BFileSystemMapping);
            }
        });

        eventService.subscribe(eventService.ENTITY_CHANGED, ({ entityName, entity }) => {
            if (entityName === 'file_system_mappings') {
                this.updateWatcher(entity as BFileSystemMapping);
            }
        });

        eventService.subscribe(eventService.ENTITY_DELETED, ({ entityName, entityId }) => {
            if (entityName === 'file_system_mappings') {
                this.removeWatcher(entityId);
            }
        });
    }

    /**
     * Initialize the file system watcher by setting up watchers for all active mappings
     */
    async init() {
        log.info('Initializing file system watcher...');

        try {
            const mappings = Object.values(becca.fileSystemMappings || {});
            for (const mapping of mappings) {
                if (mapping.isActive && mapping.canSyncFromDisk) {
                    await this.addWatcher(mapping);
                }
            }

            log.info(`File system watcher initialized with ${this.watchers.size} active mappings`);
        } catch (error) {
            log.error(`Failed to initialize file system watcher: ${error}`);
        }
    }

    /**
     * Shutdown all watchers
     */
    async shutdown() {
        log.info('Shutting down file system watcher...');

        for (const [mappingId, { watcher }] of this.watchers) {
            await watcher.close();
        }

        this.watchers.clear();
        log.info('File system watcher shutdown complete');
    }

    /**
     * Add a new file system watcher for a mapping
     */
    private async addWatcher(mapping: BFileSystemMapping) {
        if (this.watchers.has(mapping.mappingId)) {
            await this.removeWatcher(mapping.mappingId);
        }

        if (!mapping.isActive || !mapping.canSyncFromDisk) {
            return;
        }

        try {
            // Check if the file path exists
            if (!await fs.pathExists(mapping.filePath)) {
                log.info(`File path does not exist for mapping ${mapping.mappingId}: ${mapping.filePath}`);
                mapping.addSyncError(`File path does not exist: ${mapping.filePath}`);
                return;
            }

            const stats = await fs.stat(mapping.filePath);
            const watchPath = stats.isDirectory() ? mapping.filePath : path.dirname(mapping.filePath);

            const watcher = chokidar.watch(watchPath, {
                persistent: true,
                ignoreInitial: true,
                followSymlinks: false,
                depth: mapping.includeSubtree ? undefined : 0,
                ignored: this.buildIgnorePatterns(mapping)
            });

            watcher.on('add', (filePath, stats) => {
                this.queueFileChange('add', filePath, mapping.mappingId, stats);
            });

            watcher.on('change', (filePath, stats) => {
                this.queueFileChange('change', filePath, mapping.mappingId, stats);
            });

            watcher.on('unlink', (filePath) => {
                this.queueFileChange('unlink', filePath, mapping.mappingId);
            });

            watcher.on('error', (error) => {
                log.error(`File watcher error for mapping ${mapping.mappingId}: ${error}`);
                if (error && typeof error === "object" && "message" in error && typeof error.message === 'string') {
                    mapping.addSyncError(`Watcher error: ${error.message}`);
                }
            });

            watcher.on('ready', () => {
                log.info(`File watcher ready for mapping ${mapping.mappingId}: ${mapping.filePath}`);
            });

            this.watchers.set(mapping.mappingId, { mapping, watcher });

        } catch (error) {
            log.error(`Failed to create file watcher for mapping ${mapping.mappingId}: ${error}`);
            mapping.addSyncError(`Failed to create watcher: ${(error as Error).message}`);
        }
    }

    /**
     * Update an existing watcher (remove and re-add)
     */
    private async updateWatcher(mapping: BFileSystemMapping) {
        await this.addWatcher(mapping);
    }

    /**
     * Remove a file system watcher
     */
    private async removeWatcher(mappingId: string) {
        const watchedMapping = this.watchers.get(mappingId);
        if (watchedMapping) {
            await watchedMapping.watcher.close();
            this.watchers.delete(mappingId);
            log.info(`Removed file watcher for mapping ${mappingId}`);
        }
    }

    /**
     * Build ignore patterns for chokidar based on mapping configuration
     */
    private buildIgnorePatterns(mapping: BFileSystemMapping): (string | RegExp)[] {
        const patterns: (string | RegExp)[] = [
            // Always ignore common temp/system files
            /^\./,  // Hidden files
            /\.tmp$/,
            /\.temp$/,
            /~$/,   // Backup files
            /\.swp$/,  // Vim swap files
            /\.DS_Store$/,  // macOS
            /Thumbs\.db$/   // Windows
        ];

        // Add user-defined exclude patterns
        if (mapping.excludePatterns) {
            patterns.push(...mapping.excludePatterns);
        }

        return patterns;
    }

    /**
     * Queue a file change event for processing
     */
    private queueFileChange(type: 'add' | 'change' | 'unlink', filePath: string, mappingId: string, stats?: fs.Stats) {
        this.syncQueue.push({
            type,
            filePath: path.normalize(filePath),
            mappingId,
            stats
        });

        // Trigger debounced processing
        this.processSyncQueue();
    }

    /**
     * Process the sync queue (called after debounce delay)
     */
    private async _processSyncQueue() {
        if (this.isProcessing || this.syncQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const eventsToProcess = [...this.syncQueue];
        this.syncQueue = [];

        try {
            // Group events by file path to handle multiple events for the same file
            const eventMap = new Map<string, FileChangeEvent>();

            for (const event of eventsToProcess) {
                const key = `${event.mappingId}:${event.filePath}`;
                eventMap.set(key, event); // Latest event wins
            }

            // Process each unique file change
            for (const event of eventMap.values()) {
                await this.processFileChange(event);
            }

        } catch (error) {
            log.error(`Error processing file change queue: ${error}`);
        } finally {
            this.isProcessing = false;

            // If more events were queued while processing, schedule another run
            if (this.syncQueue.length > 0) {
                this.processSyncQueue();
            }
        }
    }

    /**
     * Process a single file change event
     */
    private async processFileChange(event: FileChangeEvent) {
        try {
            const mapping = becca.fileSystemMappings[event.mappingId];
            if (!mapping || !mapping.isActive || !mapping.canSyncFromDisk) {
                return;
            }

            log.info(`DEBUG: Processing file ${event.type}: ${event.filePath} for mapping ${event.mappingId}`);

            switch (event.type) {
                case 'add':
                case 'change':
                    await this.handleFileAddOrChange(event, mapping);
                    break;
                case 'unlink':
                    await this.handleFileDelete(event, mapping);
                    break;
            }

        } catch (error) {
            log.error(`Error processing file change for ${event.filePath}: ${error}`);
            const mapping = becca.fileSystemMappings[event.mappingId];
            if (mapping) {
                mapping.addSyncError(`Error processing ${event.filePath}: ${(error as Error).message}`);
            }
        }
    }

    /**
     * Handle file addition or modification
     */
    private async handleFileAddOrChange(event: FileChangeEvent, mapping: BFileSystemMapping) {
        if (!await fs.pathExists(event.filePath)) {
            return; // File was deleted between queuing and processing
        }

        const stats = event.stats || await fs.stat(event.filePath);
        if (stats.isDirectory()) {
            return; // We only sync files, not directories
        }

        // Calculate file hash for change detection
        const fileContent = await fs.readFile(event.filePath);
        const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');
        const fileModifiedTime = stats.mtime.toISOString();

        // Find existing file note mapping
        let fileNoteMapping: BFileNoteMapping | null = null;
        for (const mapping of Object.values(becca.fileNoteMappings || {})) {
            if (mapping.mappingId === event.mappingId && mapping.filePath === event.filePath) {
                fileNoteMapping = mapping;
                break;
            }
        }

        // Check if file actually changed
        if (fileNoteMapping && !fileNoteMapping.hasFileChanged(fileHash, fileModifiedTime)) {
            return; // No actual change
        }

        if (fileNoteMapping) {
            // Update existing mapping
            if (fileNoteMapping.hasNoteChanged()) {
                // Both file and note changed - mark as conflict
                fileNoteMapping.markConflict();
                log.info(`Conflict detected for ${event.filePath} - both file and note modified`);
                return;
            }

            fileNoteMapping.markPending();
        } else {
            // Create new file note mapping
            fileNoteMapping = new BFileNoteMapping({
                mappingId: event.mappingId,
                noteId: '', // Will be determined by sync service
                filePath: event.filePath,
                fileHash,
                fileModifiedTime,
                syncStatus: 'pending'
            }).save();
        }

        // Emit event for sync service to handle
        eventService.emit('FILE_CHANGED', {
            fileNoteMapping,
            mapping,
            fileContent,
            isNew: event.type === 'add'
        });
    }

    /**
     * Handle file deletion
     */
    private async handleFileDelete(event: FileChangeEvent, mapping: BFileSystemMapping) {
        // Find existing file note mapping
        let fileNoteMapping: BFileNoteMapping | null = null;
        for (const mappingObj of Object.values(becca.fileNoteMappings || {})) {
            if (mappingObj.mappingId === event.mappingId && mappingObj.filePath === event.filePath) {
                fileNoteMapping = mappingObj;
                break;
            }
        }

        if (fileNoteMapping) {
            // Emit event for sync service to handle deletion
            eventService.emit('FILE_DELETED', {
                fileNoteMapping,
                mapping
            });
        }
    }

    /**
     * Get status of all watchers
     */
    getWatcherStatus() {
        const status: Record<string, any> = {};

        for (const [mappingId, { mapping, watcher }] of this.watchers) {
            status[mappingId] = {
                filePath: mapping.filePath,
                isActive: mapping.isActive,
                watchedPaths: watcher.getWatched(),
                syncDirection: mapping.syncDirection
            };
        }

        return status;
    }

    /**
     * Force a full sync for a specific mapping
     */
    async forceSyncMapping(mappingId: string) {
        const mapping = becca.fileSystemMappings[mappingId];
        if (!mapping) {
            throw new Error(`Mapping ${mappingId} not found`);
        }

        log.info(`Force syncing mapping ${mappingId}: ${mapping.filePath}`);

        if (await fs.pathExists(mapping.filePath)) {
            const stats = await fs.stat(mapping.filePath);
            if (stats.isFile()) {
                await this.queueFileChange('change', mapping.filePath, mappingId, stats);
            } else if (stats.isDirectory() && mapping.includeSubtree) {
                // Scan directory for files
                await this.scanDirectoryForFiles(mapping.filePath, mapping);
            }
        }
    }

    /**
     * Recursively scan directory for files and queue them for sync
     */
    private async scanDirectoryForFiles(dirPath: string, mapping: BFileSystemMapping) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isFile()) {
                    const stats = await fs.stat(fullPath);
                    this.queueFileChange('change', fullPath, mapping.mappingId, stats);
                } else if (entry.isDirectory() && mapping.includeSubtree) {
                    await this.scanDirectoryForFiles(fullPath, mapping);
                }
            }
        } catch (error) {
            log.error(`Error scanning directory ${dirPath}: ${error}`);
            mapping.addSyncError(`Error scanning directory: ${(error as Error).message}`);
        }
    }
}

// Create singleton instance
const fileSystemWatcher = new FileSystemWatcher();

export default fileSystemWatcher;
