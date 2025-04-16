/**
 * Chat module export
 */
import restChatService from './rest-chat-service.js';
import sessionsStore from './sessions-store.js';
import { ContextHandler } from './handlers/context-handler.js';
import { ToolHandler } from './handlers/tool-handler.js';
import { StreamHandler } from './handlers/stream-handler.js';
import * as messageFormatter from './utils/message-formatter.js';
import type { ChatSession, ChatMessage, NoteSource } from './interfaces/session.js';
import type { LLMStreamMessage } from './interfaces/ws-messages.js';

// Export components
export {
    restChatService as default,
    sessionsStore,
    ContextHandler,
    ToolHandler,
    StreamHandler,
    messageFormatter
};

// Export types
export type {
    ChatSession,
    ChatMessage,
    NoteSource,
    LLMStreamMessage
};
