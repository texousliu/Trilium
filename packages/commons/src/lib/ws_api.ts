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

type TaskStatus<TypeT, DataT, ResultT> = {
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
    result: ResultT;
}

type TaskDefinitions =
    TaskStatus<"protectNotes", { protect: boolean; }, null>
    | TaskStatus<"importNotes", null, { importedNoteId: string }>
    | TaskStatus<"importAttachments", null, { parentNoteId?: string; importedNoteId: string }>
    | TaskStatus<"deleteNotes", null, null>
    | TaskStatus<"undeleteNotes", null, null>
    | TaskStatus<"export", null, null>
;

export type TaskType = TaskDefinitions["taskType"];

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
