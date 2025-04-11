/**
 * Types for LLM Chat Panel
 */

export interface ChatResponse {
    id: string;
    messages: Array<{role: string; content: string}>;
    sources?: Array<{noteId: string; title: string}>;
}

export interface SessionResponse {
    id: string;
    title: string;
}

export interface ToolExecutionStep {
    type: string;
    name?: string;
    content: string;
}

export interface MessageData {
    role: string;
    content: string;
    timestamp?: Date;
}

export interface ChatData {
    messages: MessageData[];
    sessionId: string | null;
    toolSteps: ToolExecutionStep[];
}
