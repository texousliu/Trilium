"use strict";

import AbstractBeccaEntity from "./abstract_becca_entity.js";
import dateUtils from "../../services/date_utils.js";
import { newEntityId } from "../../services/utils.js";

export interface FileSystemMappingRow {
    mappingId?: string;
    noteId: string;
    filePath: string;
    syncDirection?: 'bidirectional' | 'trilium_to_disk' | 'disk_to_trilium';
    isActive?: number;
    includeSubtree?: number;
    preserveHierarchy?: number;
    contentFormat?: 'auto' | 'markdown' | 'html' | 'raw';
    excludePatterns?: string | null;
    lastSyncTime?: string | null;
    syncErrors?: string | null;
    dateCreated?: string;
    dateModified?: string;
    utcDateCreated?: string;
    utcDateModified?: string;
}

/**
 * FileSystemMapping represents a mapping between a note/subtree and a file system path
 */
class BFileSystemMapping extends AbstractBeccaEntity<BFileSystemMapping> {
    static get entityName() {
        return "file_system_mappings";
    }
    static get primaryKeyName() {
        return "mappingId";
    }
    static get hashedProperties() {
        return ["mappingId", "noteId", "filePath", "syncDirection", "isActive", "includeSubtree", "preserveHierarchy", "contentFormat"];
    }

    mappingId!: string;
    noteId!: string;
    filePath!: string;
    syncDirection!: 'bidirectional' | 'trilium_to_disk' | 'disk_to_trilium';
    isActive!: boolean;
    includeSubtree!: boolean;
    preserveHierarchy!: boolean;
    contentFormat!: 'auto' | 'markdown' | 'html' | 'raw';
    excludePatterns?: (string | RegExp)[] | null;
    lastSyncTime?: string | null;
    syncErrors?: string[] | null;

    constructor(row?: FileSystemMappingRow) {
        super();

        if (!row) {
            return;
        }

        this.updateFromRow(row);
        this.init();
    }

    updateFromRow(row: FileSystemMappingRow) {
        this.update([
            row.mappingId,
            row.noteId,
            row.filePath,
            row.syncDirection || 'bidirectional',
            row.isActive !== undefined ? row.isActive : 1,
            row.includeSubtree !== undefined ? row.includeSubtree : 0,
            row.preserveHierarchy !== undefined ? row.preserveHierarchy : 1,
            row.contentFormat || 'auto',
            row.excludePatterns,
            row.lastSyncTime,
            row.syncErrors,
            row.dateCreated,
            row.dateModified,
            row.utcDateCreated,
            row.utcDateModified
        ]);
    }

    update([
        mappingId,
        noteId,
        filePath,
        syncDirection,
        isActive,
        includeSubtree,
        preserveHierarchy,
        contentFormat,
        excludePatterns,
        lastSyncTime,
        syncErrors,
        dateCreated,
        dateModified,
        utcDateCreated,
        utcDateModified
    ]: any) {
        this.mappingId = mappingId;
        this.noteId = noteId;
        this.filePath = filePath;
        this.syncDirection = syncDirection || 'bidirectional';
        this.isActive = !!isActive;
        this.includeSubtree = !!includeSubtree;
        this.preserveHierarchy = !!preserveHierarchy;
        this.contentFormat = contentFormat || 'auto';

        // Parse JSON strings for arrays
        try {
            this.excludePatterns = excludePatterns ? JSON.parse(excludePatterns) : null;
        } catch {
            this.excludePatterns = null;
        }

        try {
            this.syncErrors = syncErrors ? JSON.parse(syncErrors) : null;
        } catch {
            this.syncErrors = null;
        }

        this.lastSyncTime = lastSyncTime;
        this.dateCreated = dateCreated;
        this.dateModified = dateModified;
        this.utcDateCreated = utcDateCreated;
        this.utcDateModified = utcDateModified;

        return this;
    }

    override init() {
        if (this.mappingId) {
            this.becca.fileSystemMappings = this.becca.fileSystemMappings || {};
            this.becca.fileSystemMappings[this.mappingId] = this;
        }
    }

    get note() {
        return this.becca.notes[this.noteId];
    }

    getNote() {
        const note = this.becca.getNote(this.noteId);
        if (!note) {
            throw new Error(`Note '${this.noteId}' for file system mapping '${this.mappingId}' does not exist.`);
        }
        return note;
    }

    /**
     * Check if the mapping allows syncing from Trilium to disk
     */
    get canSyncToDisk(): boolean {
        return this.isActive && (this.syncDirection === 'bidirectional' || this.syncDirection === 'trilium_to_disk');
    }

    /**
     * Check if the mapping allows syncing from disk to Trilium
     */
    get canSyncFromDisk(): boolean {
        return this.isActive && (this.syncDirection === 'bidirectional' || this.syncDirection === 'disk_to_trilium');
    }

    /**
     * Add a sync error to the errors list
     */
    addSyncError(error: string) {
        if (!this.syncErrors) {
            this.syncErrors = [];
        }
        this.syncErrors.push(error);

        // Keep only the last 10 errors
        if (this.syncErrors.length > 10) {
            this.syncErrors = this.syncErrors.slice(-10);
        }

        this.save();
    }

    /**
     * Clear all sync errors
     */
    clearSyncErrors() {
        this.syncErrors = null;
        this.save();
    }

    /**
     * Update the last sync time
     */
    updateLastSyncTime() {
        this.lastSyncTime = dateUtils.utcNowDateTime();
        this.save();
    }

    override beforeSaving() {
        super.beforeSaving();

        if (!this.mappingId) {
            this.mappingId = newEntityId();
        }

        if (!this.dateCreated) {
            this.dateCreated = dateUtils.localNowDateTime();
        }

        if (!this.utcDateCreated) {
            this.utcDateCreated = dateUtils.utcNowDateTime();
        }

        this.dateModified = dateUtils.localNowDateTime();
        this.utcDateModified = dateUtils.utcNowDateTime();
    }

    getPojo(): FileSystemMappingRow {
        return {
            mappingId: this.mappingId,
            noteId: this.noteId,
            filePath: this.filePath,
            syncDirection: this.syncDirection,
            isActive: this.isActive ? 1 : 0,
            includeSubtree: this.includeSubtree ? 1 : 0,
            preserveHierarchy: this.preserveHierarchy ? 1 : 0,
            contentFormat: this.contentFormat,
            excludePatterns: this.excludePatterns ? JSON.stringify(this.excludePatterns) : null,
            lastSyncTime: this.lastSyncTime,
            syncErrors: this.syncErrors ? JSON.stringify(this.syncErrors) : null,
            dateCreated: this.dateCreated,
            dateModified: this.dateModified,
            utcDateCreated: this.utcDateCreated,
            utcDateModified: this.utcDateModified
        };
    }
}

export default BFileSystemMapping;
