import log from "../log.js";
import type { Request, Response } from "express";
import type { Message, ChatCompletionOptions } from "./ai_interface.js";
import contextService from "./context_service.js";
import { LLM_CONSTANTS } from './constants/provider_constants.js';
import { ERROR_PROMPTS } from './constants/llm_prompt_constants.js';
import * as aiServiceManagerModule from "./ai_service_manager.js";
import becca from "../../becca/becca.js";
import vectorStore from "./embeddings/index.js";
import providerManager from "./providers/providers.js";
import options from "../../services/options.js";
import { randomString } from "../utils.js";

// Define interfaces for the REST API
export interface NoteSource {
    noteId: string;
    title: string;
    content?: string;
    similarity?: number;
    branchId?: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    lastActive: Date;
    noteContext?: string;
    metadata: Record<string, any>;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

// In-memory storage for sessions
// In a production app, this should be stored in a database
const sessions = new Map<string, ChatSession>();

// Flag to track if cleanup timer has been initialized
let cleanupInitialized = false;

/**
 * Service to handle chat API interactions
 */
class RestChatService {
    /**
     * Initialize the session cleanup timer to remove old/inactive sessions
     */
    initializeCleanupTimer(): void {
        if (cleanupInitialized) {
            return;
        }

        // Clean sessions that have expired based on the constants
        function cleanupOldSessions() {
            const expiryTime = new Date(Date.now() - LLM_CONSTANTS.SESSION.SESSION_EXPIRY_MS);
            for (const [sessionId, session] of sessions.entries()) {
                if (session.lastActive < expiryTime) {
                    sessions.delete(sessionId);
                }
            }
        }

        // Run cleanup at the configured interval
        setInterval(cleanupOldSessions, LLM_CONSTANTS.SESSION.CLEANUP_INTERVAL_MS);
        cleanupInitialized = true;
    }

    /**
     * Check if the database is initialized
     */
    isDatabaseInitialized(): boolean {
        try {
            options.getOption('initialized');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the AI service manager in a way that doesn't crash at startup
     */
    safelyUseAIManager(): boolean {
        // Only use AI manager if database is initialized
        if (!this.isDatabaseInitialized()) {
            log.info("AI check failed: Database is not initialized");
            return false;
        }

        // Try to access the manager - will create instance only if needed
        try {
            const aiManager = aiServiceManagerModule.default;

            if (!aiManager) {
                log.info("AI check failed: AI manager module is not available");
                return false;
            }

            const isAvailable = aiManager.isAnyServiceAvailable();
            log.info(`AI service availability check result: ${isAvailable}`);

            if (isAvailable) {
                // Additional diagnostics
                try {
                    const providers = aiManager.getAvailableProviders();
                    log.info(`Available AI providers: ${providers.join(', ')}`);
                } catch (err) {
                    log.info(`Could not get available providers: ${err}`);
                }
            }

            return isAvailable;
        } catch (error) {
            log.error(`Error accessing AI service manager: ${error}`);
            return false;
        }
    }

    /**
     * Find relevant notes based on search query
     */
    async findRelevantNotes(content: string, contextNoteId: string | null = null, limit = 5): Promise<NoteSource[]> {
        try {
            // If database is not initialized, we can't do this
            if (!this.isDatabaseInitialized()) {
                return [];
            }

            // Check if embeddings are available
            const enabledProviders = await providerManager.getEnabledEmbeddingProviders();
            if (enabledProviders.length === 0) {
                log.info("No embedding providers available, can't find relevant notes");
                return [];
            }

            // If content is too short, don't bother
            if (content.length < 3) {
                return [];
            }

            // Get the embedding for the query
            const provider = enabledProviders[0];
            const embedding = await provider.generateEmbeddings(content);

            let results;
            if (contextNoteId) {
                // For branch context, get notes specifically from that branch
                const contextNote = becca.notes[contextNoteId];
                if (!contextNote) {
                    return [];
                }

                const sql = require("../../services/sql.js").default;
                const childBranches = await sql.getRows(`
                    SELECT branches.* FROM branches
                    WHERE branches.parentNoteId = ?
                    AND branches.isDeleted = 0
                `, [contextNoteId]);

                const childNoteIds = childBranches.map((branch: any) => branch.noteId);

                // Include the context note itself
                childNoteIds.push(contextNoteId);

                // Find similar notes in this context
                results = [];

                for (const noteId of childNoteIds) {
                    const noteEmbedding = await vectorStore.getEmbeddingForNote(
                        noteId,
                        provider.name,
                        provider.getConfig().model
                    );

                    if (noteEmbedding) {
                        const similarity = vectorStore.cosineSimilarity(
                            embedding,
                            noteEmbedding.embedding
                        );

                        if (similarity > 0.65) {
                            results.push({
                                noteId,
                                similarity
                            });
                        }
                    }
                }

                // Sort by similarity
                results.sort((a, b) => b.similarity - a.similarity);
                results = results.slice(0, limit);
            } else {
                // General search across all notes
                results = await vectorStore.findSimilarNotes(
                    embedding,
                    provider.name,
                    provider.getConfig().model,
                    limit
                );
            }

            // Format the results
            const sources: NoteSource[] = [];

            for (const result of results) {
                const note = becca.notes[result.noteId];
                if (!note) continue;

                let noteContent: string | undefined = undefined;
                if (note.type === 'text') {
                    const content = note.getContent();
                    // Handle both string and Buffer types
                    noteContent = typeof content === 'string' ? content :
                        content instanceof Buffer ? content.toString('utf8') : undefined;
                }

                sources.push({
                    noteId: result.noteId,
                    title: note.title,
                    content: noteContent,
                    similarity: result.similarity,
                    branchId: note.getBranches()[0]?.branchId
                });
            }

            return sources;
        } catch (error: any) {
            log.error(`Error finding relevant notes: ${error.message}`);
            return [];
        }
    }

    /**
     * Handle a message sent to an LLM and get a response
     */
    async handleSendMessage(req: Request, res: Response) {
        log.info("=== Starting handleSendMessage ===");
        try {
            // Extract parameters differently based on the request method
            let content, useAdvancedContext, showThinking, sessionId;

            if (req.method === 'POST') {
                // For POST requests, get content from the request body
                const requestBody = req.body || {};
                content = requestBody.content;
                useAdvancedContext = requestBody.useAdvancedContext || false;
                showThinking = requestBody.showThinking || false;

                // Add logging for POST requests
                log.info(`LLM POST message: sessionId=${req.params.sessionId}, useAdvancedContext=${useAdvancedContext}, showThinking=${showThinking}, contentLength=${content ? content.length : 0}`);
            } else if (req.method === 'GET') {
                // For GET (streaming) requests, get format from query params
                // The content should have been sent in a previous POST request
                useAdvancedContext = req.query.useAdvancedContext === 'true';
                showThinking = req.query.showThinking === 'true';
                content = ''; // We don't need content for GET requests

                // Add logging for GET requests
                log.info(`LLM GET stream: sessionId=${req.params.sessionId}, useAdvancedContext=${useAdvancedContext}, showThinking=${showThinking}`);
            }

            // Get sessionId from URL params since it's part of the route
            sessionId = req.params.sessionId;

            // For GET requests, ensure we have the format=stream parameter
            if (req.method === 'GET' && (!req.query.format || req.query.format !== 'stream')) {
                throw new Error('Stream format parameter is required for GET requests');
            }

            // For POST requests, validate the content
            if (req.method === 'POST' && (!content || typeof content !== 'string' || content.trim().length === 0)) {
                throw new Error('Content cannot be empty');
            }

            // Get session
            if (!sessionId || !sessions.has(sessionId)) {
                throw new Error('Session not found');
            }

            const session = sessions.get(sessionId)!;
            session.lastActive = new Date();

            // For POST requests, store the user message
            if (req.method === 'POST' && content) {
                // Add message to session
                session.messages.push({
                    role: 'user',
                    content,
                    timestamp: new Date()
                });

                // Log a preview of the message
                log.info(`Processing LLM message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
            }

            // Check if AI services are enabled before proceeding
            const aiEnabled = await options.getOptionBool('aiEnabled');
            log.info(`AI enabled setting: ${aiEnabled}`);
            if (!aiEnabled) {
                log.info("AI services are disabled by configuration");
                return {
                    error: "AI features are disabled. Please enable them in the settings."
                };
            }

            // Check if AI services are available
            log.info("Checking if AI services are available...");
            if (!this.safelyUseAIManager()) {
                log.info("AI services are not available - checking for specific issues");

                try {
                    const aiManager = aiServiceManagerModule.default;

                    if (!aiManager) {
                        log.error("AI service manager is not initialized");
                        return {
                            error: "AI service is not properly initialized. Please check your configuration."
                        };
                    }

                    const availableProviders = aiManager.getAvailableProviders();
                    if (availableProviders.length === 0) {
                        log.error("No AI providers are available");
                        return {
                            error: "No AI providers are configured or available. Please check your AI settings."
                        };
                    }
                } catch (err) {
                    log.error(`Detailed AI service check failed: ${err}`);
                }

                return {
                    error: "AI services are currently unavailable. Please check your configuration."
                };
            }

            // Get the AI service manager
            const aiServiceManager = aiServiceManagerModule.default.getInstance();

            // Get the default service - just use the first available one
            const availableProviders = aiServiceManager.getAvailableProviders();

            if (availableProviders.length === 0) {
                log.error("No AI providers are available after manager check");
                return {
                    error: "No AI providers are configured or available. Please check your AI settings."
                };
            }

            // Use the first available provider
            const providerName = availableProviders[0];
            log.info(`Using AI provider: ${providerName}`);

            // We know the manager has a 'services' property from our code inspection,
            // but TypeScript doesn't know that from the interface.
            // This is a workaround to access it
            const service = (aiServiceManager as any).services[providerName];

            if (!service) {
                log.error(`AI service for provider ${providerName} not found`);
                return {
                    error: `Selected AI provider (${providerName}) is not available. Please check your configuration.`
                };
            }

            // Information to return to the client
            let aiResponse = '';
            let sourceNotes: NoteSource[] = [];

            // Check if this is a streaming request
            const isStreamingRequest = req.method === 'GET' && req.query.format === 'stream';

            // For POST requests, we need to process the message
            // For GET (streaming) requests, we use the latest user message from the session
            if (req.method === 'POST' || isStreamingRequest) {
                // Get the latest user message for context
                const latestUserMessage = session.messages
                    .filter(msg => msg.role === 'user')
                    .pop();

                if (!latestUserMessage && req.method === 'GET') {
                    throw new Error('No user message found in session');
                }

                // Use the latest message content for GET requests
                const messageContent = req.method === 'POST' ? content : latestUserMessage!.content;

                try {
                    // If Advanced Context is enabled, we use the improved method
                    if (useAdvancedContext) {
                        sourceNotes = await this.processAdvancedContext(
                            messageContent,
                            session,
                            service,
                            isStreamingRequest,
                            res,
                            showThinking
                        );
                    } else {
                        sourceNotes = await this.processStandardContext(
                            messageContent,
                            session,
                            service,
                            isStreamingRequest,
                            res
                        );
                    }

                    // For streaming requests we don't return anything as we've already sent the response
                    if (isStreamingRequest) {
                        return null;
                    }

                    // For POST requests, return the response
                    if (req.method === 'POST') {
                        // Get the latest assistant message for the response
                        const latestAssistantMessage = session.messages
                            .filter(msg => msg.role === 'assistant')
                            .pop();

                        return {
                            content: latestAssistantMessage?.content || '',
                            sources: sourceNotes.map(note => ({
                                noteId: note.noteId,
                                title: note.title,
                                similarity: note.similarity
                            }))
                        };
                    }
                } catch (processingError: any) {
                    log.error(`Error processing message: ${processingError}`);
                    return {
                        error: `Error processing your request: ${processingError.message}`
                    };
                }
            }

            // If it's not a POST or streaming GET request, return the session's message history
            return {
                id: session.id,
                messages: session.messages
            };
        } catch (error: any) {
            log.error(`Error in LLM query processing: ${error}`);
            return {
                error: ERROR_PROMPTS.USER_ERRORS.GENERAL_ERROR
            };
        }
    }

    /**
     * Process a request with advanced context
     */
    private async processAdvancedContext(
        messageContent: string,
        session: ChatSession,
        service: any,
        isStreamingRequest: boolean,
        res: Response,
        showThinking: boolean
    ): Promise<NoteSource[]> {
        // Use the Trilium-specific approach
        const contextNoteId = session.noteContext || null;

        // Log that we're calling contextService with the parameters
        log.info(`Using enhanced context with: noteId=${contextNoteId}, showThinking=${showThinking}`);

        const results = await contextService.processQuery(
            messageContent,
            service,
            contextNoteId,
            showThinking
        );

        // Get the generated context
        const context = results.context;
        // Convert from NoteSearchResult to NoteSource
        const sourceNotes = results.sources.map(source => ({
            noteId: source.noteId,
            title: source.title,
            content: source.content || undefined, // Convert null to undefined
            similarity: source.similarity
        }));

        // Format messages for the LLM using the proper context
        const aiMessages = await contextService.buildMessagesWithContext(
            session.messages.slice(-LLM_CONSTANTS.SESSION.MAX_SESSION_MESSAGES).map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            context,
            service
        );

        // DEBUG: Log message structure being sent to LLM
        log.info(`Message structure being sent to LLM: ${aiMessages.length} messages total`);

        // Configure chat options from session metadata
        const chatOptions: ChatCompletionOptions = {
            temperature: session.metadata.temperature || 0.7,
            maxTokens: session.metadata.maxTokens,
            model: session.metadata.model,
            stream: isStreamingRequest ? true : undefined
        };

        // Process based on whether this is a streaming request
        if (isStreamingRequest) {
            await this.handleStreamingResponse(res, aiMessages, chatOptions, service, session);
        } else {
            // Non-streaming approach for POST requests
            const response = await service.generateChatCompletion(aiMessages, chatOptions);
            const aiResponse = response.text; // Extract the text from the response

            // Store the assistant's response in the session
            session.messages.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            });
        }

        return sourceNotes;
    }

    /**
     * Process a request with standard context
     */
    private async processStandardContext(
        messageContent: string,
        session: ChatSession,
        service: any,
        isStreamingRequest: boolean,
        res: Response
    ): Promise<NoteSource[]> {
        // Original approach - find relevant notes through direct embedding comparison
        const relevantNotes = await this.findRelevantNotes(
            messageContent,
            session.noteContext || null,
            5
        );

        // Build context from relevant notes
        const context = this.buildContextFromNotes(relevantNotes, messageContent);

        // Get messages with context properly formatted for the specific LLM provider
        const aiMessages = await contextService.buildMessagesWithContext(
            session.messages.slice(-LLM_CONSTANTS.SESSION.MAX_SESSION_MESSAGES).map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            context,
            service
        );

        // Configure chat options from session metadata
        const chatOptions: ChatCompletionOptions = {
            temperature: session.metadata.temperature || 0.7,
            maxTokens: session.metadata.maxTokens,
            model: session.metadata.model,
            stream: isStreamingRequest ? true : undefined
        };

        if (isStreamingRequest) {
            await this.handleStreamingResponse(res, aiMessages, chatOptions, service, session);
        } else {
            // Non-streaming approach for POST requests
            const response = await service.generateChatCompletion(aiMessages, chatOptions);
            const aiResponse = response.text; // Extract the text from the response

            // Store the assistant's response in the session
            session.messages.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            });
        }

        return relevantNotes;
    }

    /**
     * Handle streaming response from LLM
     */
    private async handleStreamingResponse(
        res: Response,
        aiMessages: Message[],
        chatOptions: ChatCompletionOptions,
        service: any,
        session: ChatSession
    ) {
        // Set streaming headers once
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Flag to indicate we've handled the response directly
        // This lets the route handler know not to process the result
        (res as any).triliumResponseHandled = true;

        let messageContent = '';

        try {
            // Use the correct method name: generateChatCompletion
            const response = await service.generateChatCompletion(aiMessages, chatOptions);

            // Handle streaming if the response includes a stream method
            if (response.stream) {
                await response.stream((chunk: { text: string; done: boolean }) => {
                    if (chunk.text) {
                        messageContent += chunk.text;
                        // Only write if the response hasn't finished
                        if (!res.writableEnded) {
                            res.write(`data: ${JSON.stringify({ content: chunk.text })}\n\n`);
                        }
                    }

                    if (chunk.done) {
                        // Signal the end of the stream when done, only if not already ended
                        if (!res.writableEnded) {
                            res.write('data: [DONE]\n\n');
                            res.end();
                        }
                    }
                });
            } else {
                // If no streaming available, send the response as a single chunk
                messageContent = response.text;
                // Only write if the response hasn't finished
                if (!res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ content: messageContent })}\n\n`);
                    res.write('data: [DONE]\n\n');
                    res.end();
                }
            }

            // Store the full response for the session
            const aiResponse = messageContent;

            // Store the assistant's response in the session
            session.messages.push({
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            });
        } catch (streamingError: any) {
            // If streaming fails and we haven't sent a response yet, throw the error
            if (!res.headersSent) {
                throw streamingError;
            } else {
                // If headers were already sent, try to send an error event
                try {
                    if (!res.writableEnded) {
                        res.write(`data: ${JSON.stringify({ error: streamingError.message })}\n\n`);
                        res.write('data: [DONE]\n\n');
                        res.end();
                    }
                } catch (e) {
                    log.error(`Failed to write streaming error: ${e}`);
                }
            }
        }
    }

    /**
     * Build context from relevant notes
     */
    buildContextFromNotes(sources: NoteSource[], query: string): string {
        if (!sources || sources.length === 0) {
            return query || '';
        }

        const noteContexts = sources
            .filter(source => source.content) // Only include sources with content
            .map((source) => {
                // Format each note with its title as a natural heading and wrap in <note> tags
                return `<note>\n### ${source.title}\n${source.content || 'No content available'}\n</note>`;
            })
            .join('\n\n');

        if (!noteContexts) {
            return query || '';
        }

        // Import the CONTEXT_PROMPTS constant
        const { CONTEXT_PROMPTS } = require('./constants/llm_prompt_constants.js');

        // Use the template from the constants file, replacing placeholders
        return CONTEXT_PROMPTS.CONTEXT_NOTES_WRAPPER
            .replace('{noteContexts}', noteContexts)
            .replace('{query}', query);
    }

    /**
     * Get all sessions
     */
    getSessions() {
        return sessions;
    }

    /**
     * Create a new chat session
     */
    async createSession(req: Request, res: Response) {
        try {
            // Initialize cleanup if not already done
            this.initializeCleanupTimer();

            const options: any = req.body || {};
            const title = options.title || 'Chat Session';

            const sessionId = randomString(16);
            const now = new Date();

            // Initial system message if provided
            const messages: ChatMessage[] = [];
            if (options.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: options.systemPrompt,
                    timestamp: now
                });
            }

            // Store session info
            sessions.set(sessionId, {
                id: sessionId,
                title,
                messages,
                createdAt: now,
                lastActive: now,
                noteContext: options.contextNoteId,
                metadata: {
                    temperature: options.temperature,
                    maxTokens: options.maxTokens,
                    model: options.model,
                    provider: options.provider
                }
            });

            return {
                id: sessionId,
                title,
                createdAt: now
            };
        } catch (error: any) {
            log.error(`Error creating LLM session: ${error.message || 'Unknown error'}`);
            throw new Error(`Failed to create LLM session: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Get a specific chat session by ID
     */
    async getSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;

            // Check if session exists
            const session = sessions.get(sessionId);
            if (!session) {
                throw new Error(`Session with ID ${sessionId} not found`);
            }

            // Return session without internal metadata
            return {
                id: session.id,
                title: session.title,
                createdAt: session.createdAt,
                lastActive: session.lastActive,
                messages: session.messages,
                noteContext: session.noteContext
            };
        } catch (error: any) {
            log.error(`Error getting LLM session: ${error.message || 'Unknown error'}`);
            throw new Error(`Failed to get session: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Update a chat session's settings
     */
    async updateSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;
            const updates = req.body || {};

            // Check if session exists
            const session = sessions.get(sessionId);
            if (!session) {
                throw new Error(`Session with ID ${sessionId} not found`);
            }

            // Update allowed fields
            if (updates.title) {
                session.title = updates.title;
            }

            if (updates.noteContext) {
                session.noteContext = updates.noteContext;
            }

            // Update metadata
            if (updates.temperature !== undefined) {
                session.metadata.temperature = updates.temperature;
            }

            if (updates.maxTokens !== undefined) {
                session.metadata.maxTokens = updates.maxTokens;
            }

            if (updates.model) {
                session.metadata.model = updates.model;
            }

            if (updates.provider) {
                session.metadata.provider = updates.provider;
            }

            // Update timestamp
            session.lastActive = new Date();

            return {
                id: session.id,
                title: session.title,
                updatedAt: session.lastActive
            };
        } catch (error: any) {
            log.error(`Error updating LLM session: ${error.message || 'Unknown error'}`);
            throw new Error(`Failed to update session: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * List all chat sessions
     */
    async listSessions(req: Request, res: Response) {
        try {
            const sessionList = Array.from(sessions.values()).map(session => ({
                id: session.id,
                title: session.title,
                createdAt: session.createdAt,
                lastActive: session.lastActive,
                messageCount: session.messages.length
            }));

            // Sort by last activity (most recent first)
            sessionList.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());

            return {
                sessions: sessionList
            };
        } catch (error: any) {
            log.error(`Error listing LLM sessions: ${error.message || 'Unknown error'}`);
            throw new Error(`Failed to list sessions: ${error.message || 'Unknown error'}`);
        }
    }

    /**
     * Delete a chat session
     */
    async deleteSession(req: Request, res: Response) {
        try {
            const { sessionId } = req.params;

            // Check if session exists
            if (!sessions.has(sessionId)) {
                throw new Error(`Session with ID ${sessionId} not found`);
            }

            // Delete session
            sessions.delete(sessionId);

            return {
                success: true,
                message: `Session ${sessionId} deleted successfully`
            };
        } catch (error: any) {
            log.error(`Error deleting LLM session: ${error.message || 'Unknown error'}`);
            throw new Error(`Failed to delete session: ${error.message || 'Unknown error'}`);
        }
    }
}

// Create singleton instance
const restChatService = new RestChatService();
export default restChatService;
