"use strict";

import AbstractBeccaEntity from "./abstract_becca_entity.js";
import dateUtils from "../../services/date_utils.js";
import { newEntityId } from "../../services/utils.js";

export interface FileNoteMappingRow {
    fileNoteId?: string;
    mappingId: string;
    noteId: string;
    filePath: string;
    fileHash?: string | null;
    fileModifiedTime?: string | null;
    lastSyncTime?: string | null;
    syncStatus?: 'synced' | 'pending' | 'conflict' | 'error';
    dateCreated?: string;
    dateModified?: string;
    utcDateCreated?: string;
    utcDateModified?: string;
}

/**
 * FileNoteMapping represents the mapping between a specific file and a specific note
 * This is used for tracking sync status and file metadata
 */
class BFileNoteMapping extends AbstractBeccaEntity<BFileNoteMapping> {
    static get entityName() {
        return "file_note_mappings";
    }
    static get primaryKeyName() {
        return "fileNoteId";
    }
    static get hashedProperties() {
        return ["fileNoteId", "mappingId", "noteId", "filePath", "fileHash", "syncStatus"];
    }

    fileNoteId!: string;
    mappingId!: string;
    noteId!: string;
    filePath!: string;
    fileHash?: string | null;
    fileModifiedTime?: string | null;
    lastSyncTime?: string | null;
    syncStatus!: 'synced' | 'pending' | 'conflict' | 'error';

    constructor(row?: FileNoteMappingRow) {
        super();

        if (!row) {
            return;
        }

        this.updateFromRow(row);
        this.init();
    }

    updateFromRow(row: FileNoteMappingRow) {
        this.update([
            row.fileNoteId,
            row.mappingId,
            row.noteId,
            row.filePath,
            row.fileHash,
            row.fileModifiedTime,
            row.lastSyncTime,
            row.syncStatus || 'synced',
            row.dateCreated,
            row.dateModified,
            row.utcDateCreated,
            row.utcDateModified
        ]);
    }

    update([
        fileNoteId,
        mappingId,
        noteId,
        filePath,
        fileHash,
        fileModifiedTime,
        lastSyncTime,
        syncStatus,
        dateCreated,
        dateModified,
        utcDateCreated,
        utcDateModified
    ]: any) {
        this.fileNoteId = fileNoteId;
        this.mappingId = mappingId;
        this.noteId = noteId;
        this.filePath = filePath;
        this.fileHash = fileHash;
        this.fileModifiedTime = fileModifiedTime;
        this.lastSyncTime = lastSyncTime;
        this.syncStatus = syncStatus || 'synced';
        this.dateCreated = dateCreated;
        this.dateModified = dateModified;
        this.utcDateCreated = utcDateCreated;
        this.utcDateModified = utcDateModified;

        return this;
    }

    override init() {
        if (this.fileNoteId) {
            this.becca.fileNoteMappings = this.becca.fileNoteMappings || {};
            this.becca.fileNoteMappings[this.fileNoteId] = this;
        }
    }

    get note() {
        return this.becca.notes[this.noteId];
    }

    get mapping() {
        return this.becca.fileSystemMappings?.[this.mappingId];
    }

    getNote() {
        const note = this.becca.getNote(this.noteId);
        if (!note) {
            throw new Error(`Note '${this.noteId}' for file note mapping '${this.fileNoteId}' does not exist.`);
        }
        return note;
    }

    getMapping() {
        const mapping = this.mapping;
        if (!mapping) {
            throw new Error(`File system mapping '${this.mappingId}' for file note mapping '${this.fileNoteId}' does not exist.`);
        }
        return mapping;
    }

    /**
     * Mark this mapping as needing sync
     */
    markPending() {
        this.syncStatus = 'pending';
        this.save();
    }

    /**
     * Mark this mapping as having a conflict
     */
    markConflict() {
        this.syncStatus = 'conflict';
        this.save();
    }

    /**
     * Mark this mapping as having an error
     */
    markError() {
        this.syncStatus = 'error';
        this.save();
    }

    /**
     * Mark this mapping as synced and update sync time
     */
    markSynced(fileHash?: string, fileModifiedTime?: string) {
        this.syncStatus = 'synced';
        this.lastSyncTime = dateUtils.utcNowDateTime();

        if (fileHash !== undefined) {
            this.fileHash = fileHash;
        }

        if (fileModifiedTime !== undefined) {
            this.fileModifiedTime = fileModifiedTime;
        }

        this.save();
    }

    /**
     * Check if the file has been modified since last sync
     */
    hasFileChanged(currentFileHash: string, currentModifiedTime: string): boolean {
        return this.fileHash !== currentFileHash || this.fileModifiedTime !== currentModifiedTime;
    }

    /**
     * Check if the note has been modified since last sync
     */
    hasNoteChanged(): boolean {
        const note = this.note;
        if (!note) return false;

        if (!this.lastSyncTime) return true;

        return (note.utcDateModified ?? note.dateModified ?? note.utcDateCreated) > this.lastSyncTime;
    }

    override beforeSaving() {
        super.beforeSaving();

        if (!this.fileNoteId) {
            this.fileNoteId = newEntityId();
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

    getPojo(): FileNoteMappingRow {
        return {
            fileNoteId: this.fileNoteId,
            mappingId: this.mappingId,
            noteId: this.noteId,
            filePath: this.filePath,
            fileHash: this.fileHash,
            fileModifiedTime: this.fileModifiedTime,
            lastSyncTime: this.lastSyncTime,
            syncStatus: this.syncStatus,
            dateCreated: this.dateCreated,
            dateModified: this.dateModified,
            utcDateCreated: this.utcDateCreated,
            utcDateModified: this.utcDateModified
        };
    }
}

export default BFileNoteMapping;
