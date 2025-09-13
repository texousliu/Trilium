import { AttachmentRow, AttributeRow, BranchRow, NoteRow, NoteType } from "./rows.js";

type Response = {
    success: true,
    message?: string;
} | {
    success: false;
    message: string;
}

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

export interface RevisionPojo {
    revisionId?: string;
    noteId: string;
    type: NoteType;
    mime: string;
    isProtected?: boolean;
    title: string;
    blobId?: string;
    dateLastEdited?: string;
    dateCreated?: string;
    utcDateLastEdited?: string;
    utcDateCreated?: string;
    utcDateModified?: string;
    content?: string | Buffer<ArrayBufferLike>;
    contentLength?: number;
}

export interface RecentChangeRow {
    noteId: string;
    current_isDeleted: boolean;
    current_deleteId: string;
    current_title: string;
    current_isProtected: boolean;
    title: string;
    utcDate: string;
    date: string;
    canBeUndeleted?: boolean;
}

export interface BulkActionAffectedNotes {
    affectedNoteCount: number;
}

export interface DatabaseCheckIntegrityResponse {
    results: {
        integrity_check: string;
    }[];
}

export interface DatabaseAnonymizeResponse {
    success: boolean;
    anonymizedFilePath: string;
}

export interface AnonymizedDbResponse {
    filePath: string;
    fileName: string;
}

export type SyncTestResponse = Response;

export interface EtapiToken {
    name: string;
    utcDateCreated: string;
    etapiTokenId?: string;
}

export interface PostTokensResponse {
    authToken: string;
}

export interface BackupDatabaseNowResponse {
    backupFile: string;
}

export interface DatabaseBackup {
    fileName: string;
    filePath: string;
    mtime: Date;
}

export type ChangePasswordResponse = Response;

export interface TOTPStatus {
    set: boolean;
}

export interface TOTPGenerate {
    success: boolean;
    message: string;
}

export interface TOTPRecoveryKeysResponse {
    success: boolean;
    recoveryCodes?: string[];
    keysExist?: boolean;
    usedRecoveryCodes?: string[];
}

export interface OAuthStatus {
    enabled: boolean;
    name?: string;
    email?: string;
    missingVars?: string[];
}

// Interface for the Ollama model response
export interface OllamaModelResponse {
    success: boolean;
    models: Array<{
        name: string;
        model: string;
        details?: {
            family?: string;
            parameter_size?: string;
        }
    }>;
}


export interface OpenAiOrAnthropicModelResponse {
    success: boolean;
    chatModels: Array<{
        id: string;
        name: string;
        type: string;
    }>;
}

export type ToggleInParentResponse = {
    success: true;
} | {
    success: false;
    message: string;
}

export type EditedNotesResponse = {
    noteId: string;
    isDeleted: boolean;
    title?: string;
    notePath?: string[] | null;
}[];

export interface MetadataResponse {
    dateCreated: string | undefined;
    utcDateCreated: string;
    dateModified: string | undefined;
    utcDateModified: string | undefined;
}

export interface NoteSizeResponse {
    noteSize: number;
}

export interface SubtreeSizeResponse {
    subTreeNoteCount: number;
    subTreeSize: number;
}

export interface SimilarNote {
    score: number;
    notePath: string[];
    noteId: string;
}

export type SimilarNoteResponse = (SimilarNote[] | undefined);

export type SaveSearchNoteResponse = CloneResponse;

export interface CloneResponse {
    success: boolean;
    message?: string;
    branchId?: string;
    notePath?: string;
}

export interface ConvertToAttachmentResponse {
    attachment: AttachmentRow;
}

export type SaveSqlConsoleResponse = CloneResponse;

export interface BacklinkCountResponse {
    count: number;
}

export type BacklinksResponse = ({
    noteId: string;
    relationName: string;
} | {
    noteId: string;
    excerpts: string[]
})[];


export type SqlExecuteResults = (object[] | object)[];

export interface SqlExecuteResponse {
    success: boolean;
    error?: string;
    results: SqlExecuteResults;
}

export interface CreateChildrenResponse {
    note: NoteRow;
    branch: BranchRow;
}

export interface SchemaResponse {
    name: string;
    columns: {
        name: string;
        type: string;
    }[];
}

export interface EntityChange {
    id?: number | null;
    noteId?: string;
    entityName: string;
    entityId: string;
    entity?: any;
    positions?: Record<string, number>;
    hash: string;
    utcDateChanged?: string;
    utcDateModified?: string;
    utcDateCreated?: string;
    isSynced: boolean | 1 | 0;
    isErased: boolean | 1 | 0;
    componentId?: string | null;
    changeId?: string | null;
    instanceId?: string | null;
}

export interface EntityRow {
    isDeleted?: boolean;
    content?: Buffer | string;
}

export interface EntityChangeRecord {
    entityChange: EntityChange;
    entity?: EntityRow;
}

type TaskStatus<TypeT, DataT> = {
    type: "taskProgressCount",
    taskId: string;
    taskType: TypeT;
    data: DataT,
    progressCount: number
} | {
    type: "taskError",
    taskId: string;
    taskType: TypeT;
    data: DataT;
    message: string;
} | {
    type: "taskSucceeded",
    taskId: string;
    taskType: TypeT;
    data: DataT;
    result?: string | Record<string, string | undefined>
}

type TaskDefinitions =
    TaskStatus<"protectNotes", { protect: boolean; }>
    | TaskStatus<"importNotes", null>
    | TaskStatus<"importAttachments", null>
    | TaskStatus<"deleteNotes", null>
    | TaskStatus<"undeleteNotes", null>
    | TaskStatus<"export", null>
;

export interface OpenedFileUpdateStatus {
    entityType: string;
    entityId: string;
    lastModifiedMs?: number;
    filePath: string;
}

export type WebSocketMessage = TaskDefinitions | {
    type: "ping"
} | {
    type: "frontend-update",
    data: {
        lastSyncedPush: number,
        entityChanges: EntityChange[]
    }
} | {
    type: "openNote",
    noteId: string
} | OpenedFileUpdateStatus & {
    type: "openedFileUpdated"
} | {
    type: "protectedSessionLogin"
} | {
    type: "protectedSessionLogout"
} | {
    type: "toast",
    message: string;
} | {
    type: "api-log-messages",
    noteId: string,
    messages: string[]
} | {
    type: "execute-script";
    script: string;
    params: unknown[];
    startNoteId?: string;
    currentNoteId: string;
    originEntityName: string;
    originEntityId?: string | null;
} | {
    type: "reload-frontend";
    reason: string;
} | {
    type: "sync-pull-in-progress" | "sync-push-in-progress" | "sync-finished" | "sync-failed";
    lastSyncedPush: number;
} | {
    type: "consistency-checks-failed"
} | {
    type: "llm-stream",
    chatNoteId: string;
    done?: boolean;
    error?: string;
    thinking?: string;
    content?: string;
    toolExecution?: {
        action?: string;
        tool?: string;
        toolCallId?: string;
        result?: string | Record<string, any>;
        error?: string;
        args?: Record<string, unknown>;
    }
}
