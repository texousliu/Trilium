import { AttributeRow, NoteType } from "./rows.js";

export interface AppInfo {
    appVersion: string;
    dbVersion: number;
    nodeVersion: string;
    syncVersion: number;
    buildDate: string;
    buildRevision: string;
    dataDirectory: string;
    clipperProtocolVersion: string;
    /** for timezone inference */
    utcDateTime: string;
}

export interface DeleteNotesPreview {
    noteIdsToBeDeleted: string[];
    brokenRelations: AttributeRow[];
}

export interface RevisionItem {
    noteId: string;
    revisionId?: string;
    dateLastEdited?: string;
    contentLength?: number;
    type: NoteType;
    title: string;
    isProtected?: boolean;
    mime: string;
}
