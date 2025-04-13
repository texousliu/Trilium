import log from "../log.js";
import type { Request, Response } from "express";
import type { Message, ChatCompletionOptions, ChatResponse, StreamChunk } from "./ai_interface.js";

/**
 * Interface for WebSocket LLM streaming messages
 */
interface LLMStreamMessage {
    type: 'llm-stream' | 'tool_execution_start' | 'tool_result' | 'tool_execution_error' | 'tool_completion_processing';
    sessionId: string;
    content?: string;
    thinking?: string;
    toolExecution?: {
        action?: string;
        tool?: string;
        toolCallId?: string;
        result?: string | Record<string, any>;
        error?: string;
        args?: Record<string, unknown>;
    };
    done?: boolean;
    error?: string;
    raw?: unknown;
}
import contextService from "./context/services/context_service.js";
import { LLM_CONSTANTS } from './constants/provider_constants.js';
import { ERROR_PROMPTS } from './constants/llm_prompt_constants.js';
import becca from "../../becca/becca.js";
import vectorStore from "./embeddings/index.js";
import providerManager from "./providers/providers.js";
import options from "../../services/options.js";
import { randomString } from "../utils.js";
import type { LLMServiceInterface } from './interfaces/agent_tool_interfaces.js';
import { AIServiceManager } from "./ai_service_manager.js";
import { ChatPipeline } from "./pipeline/chat_pipeline.js";
import type { ChatPipelineInput } from "./pipeline/interfaces.js";

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

// For message formatting - simple implementation to avoid dependency
const formatMessages = {
    getFormatter(providerName: string) {
        return {
            formatMessages(messages: Message[], systemPrompt?: string, context?: string): Message[] {
                // Simple implementation that works for most providers
                const formattedMessages: Message[] = [];

                // Add system message if context or systemPrompt is provided
                if (context || systemPrompt) {
                    formattedMessages.push({
                        role: 'system',
                        content: systemPrompt || (context ? `Use the following context to answer the query: ${context}` : '')
                    });
                }

                // Add all other messages
                for (const message of messages) {
                    if (message.role === 'system' && formattedMessages.some(m => m.role === 'system')) {
                        // Skip duplicate system messages
                        continue;
                    }
                    formattedMessages.push(message);
                }

                return formattedMessages;
            }
        };
    }
};

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
            // Create local instance to avoid circular references
            const aiManager = new AIServiceManager();

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
                // For GET (streaming) requests, get parameters from query params and body
                // For streaming requests, we need the content from the body
                useAdvancedContext = req.query.useAdvancedContext === 'true' || (req.body && req.body.useAdvancedContext === true);
                showThinking = req.query.showThinking === 'true' || (req.body && req.body.showThinking === true);
                content = req.body && req.body.content ? req.body.content : '';

                // Add detailed logging for GET requests
                log.info(`LLM GET stream: sessionId=${req.params.sessionId}, useAdvancedContext=${useAdvancedContext}, showThinking=${showThinking}`);
                log.info(`Parameters from query: useAdvancedContext=${req.query.useAdvancedContext}, showThinking=${req.query.showThinking}`);
                log.info(`Parameters from body: useAdvancedContext=${req.body?.useAdvancedContext}, showThinking=${req.body?.showThinking}, content=${content ? `${content.substring(0, 20)}...` : 'none'}`);
            }

            // Get sessionId from URL params since it's part of the route
            sessionId = req.params.sessionId;

            // For GET requests, ensure we have the stream parameter
            if (req.method === 'GET' && req.query.stream !== 'true') {
                throw new Error('Stream parameter must be set to true for GET/streaming requests');
            }

            // For POST requests, validate the content
            if (req.method === 'POST' && (!content || typeof content !== 'string' || content.trim().length === 0)) {
                throw new Error('Content cannot be empty');
            }

            // Check if session exists, create one if not
            let session: ChatSession;
            if (!sessionId || !sessions.has(sessionId)) {
                if (req.method === 'GET') {
                    // For GET requests, we must have an existing session
                    throw new Error('Session not found');
                }

                // For POST requests, we can create a new session automatically
                log.info(`Session ${sessionId} not found, creating a new one automatically`);
                const now = new Date();
                session = {
                    id: sessionId || randomString(16),
                    title: 'Auto-created Session',
                    messages: [],
                    createdAt: now,
                    lastActive: now,
                    metadata: {
                        temperature: 0.7,
                        maxTokens: undefined,
                        model: undefined,
                        provider: undefined
                    }
                };
                sessions.set(session.id, session);
                log.info(`Created new session with ID: ${session.id}`);
            } else {
                session = sessions.get(sessionId)!;
            }

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
                    // Create a direct instance to avoid circular references
                    const aiManager = new AIServiceManager();

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

            // Create direct instance to avoid circular references
            const aiManager = new AIServiceManager();

            // Get the default service - just use the first available one
            const availableProviders = aiManager.getAvailableProviders();

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
            const service = (aiManager as any).services[providerName];

            if (!service) {
                log.error(`AI service for provider ${providerName} not found`);
                return {
                    error: `Selected AI provider (${providerName}) is not available. Please check your configuration.`
                };
            }

            // Initialize tools
            log.info("Initializing LLM agent tools...");
            // Ensure tools are initialized to prevent tool execution issues
            await this.ensureToolsInitialized();

            // Create and use the chat pipeline instead of direct processing
            const pipeline = new ChatPipeline({
                enableStreaming: req.method === 'GET',
                enableMetrics: true,
                maxToolCallIterations: 5
            });

            log.info("Executing chat pipeline...");

            // Create options object for better tracking
            const pipelineOptions = {
                // Force useAdvancedContext to be a boolean, no matter what
                useAdvancedContext: useAdvancedContext === true,
                systemPrompt: session.messages.find(m => m.role === 'system')?.content,
                temperature: session.metadata.temperature,
                maxTokens: session.metadata.maxTokens,
                model: session.metadata.model,
                // Set stream based on request type, but ensure it's explicitly a boolean value
                // GET requests or format=stream parameter indicates streaming should be used
                stream: !!(req.method === 'GET' || req.query.format === 'stream' || req.query.stream === 'true')
            };

            // Log the options to verify what's being sent to the pipeline
            log.info(`Pipeline input options: ${JSON.stringify({
                useAdvancedContext: pipelineOptions.useAdvancedContext,
                stream: pipelineOptions.stream
            })}`);

            // Import the WebSocket service for direct access
            const wsService = await import('../../services/ws.js');

            // Create a stream callback wrapper
            // This will ensure we properly handle all streaming messages
            let messageContent = '';
            let streamFinished = false;

            // Prepare the pipeline input
            const pipelineInput: ChatPipelineInput = {
                messages: session.messages.map(msg => ({
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: msg.content
                })),
                query: content,
                noteId: session.noteContext ?? undefined,
                showThinking: showThinking,
                options: pipelineOptions,
                streamCallback: req.method === 'GET' ? (data, done, rawChunk) => {
                    try {
                        // Send a single WebSocket message that contains everything needed
                        // Only accumulate content that's actually text (not tool execution or thinking info)
                        if (data) {
                            messageContent += data;
                        }

                        // Create a message object with all necessary fields
                        const message: LLMStreamMessage = {
                            type: 'llm-stream',
                            sessionId
                        };

                        // Add content if available - either the new chunk or full content on completion
                        if (data) {
                            message.content = data;
                        }

                        // Add thinking info if available in the raw chunk
                        if (rawChunk?.thinking) {
                            message.thinking = rawChunk.thinking;
                        }

                        // Add tool execution info if available in the raw chunk
                        if (rawChunk?.toolExecution) {
                            message.toolExecution = rawChunk.toolExecution;
                        }

                        // Set done flag explicitly
                        message.done = done;

                        // On final message, include the complete content too
                        if (done) {
                            streamFinished = true;

                            // Always send the accumulated content with the done=true message
                            // This ensures the client receives the complete content even if earlier messages were missed
                            message.content = messageContent;

                            log.info(`Stream complete, sending final message with ${messageContent.length} chars of content`);

                            // Store the response in the session when done
                            session.messages.push({
                                role: 'assistant',
                                content: messageContent,
                                timestamp: new Date()
                            });
                        }

                        // Send message to all clients
                        wsService.default.sendMessageToAllClients(message);

                        // Log what was sent (first message and completion)
                        if (message.thinking || done) {
                            log.info(
                                `[WS-SERVER] Sending LLM stream message: sessionId=${sessionId}, content=${!!message.content}, contentLength=${message.content?.length || 0}, thinking=${!!message.thinking}, toolExecution=${!!message.toolExecution}, done=${done}`
                            );
                        }

                        // For GET requests, also send as server-sent events
                        // Prepare response data for JSON event
                        const responseData: any = {
                            content: data,
                            done
                        };

                        // Add tool execution if available
                        if (rawChunk?.toolExecution) {
                            responseData.toolExecution = rawChunk.toolExecution;
                        }

                        // Send the data as a JSON event
                        res.write(`data: ${JSON.stringify(responseData)}\n\n`);

                        if (done) {
                            res.end();
                        }
                    } catch (error) {
                        log.error(`Error in stream callback: ${error}`);

                        // Try to send error message
                        try {
                            wsService.default.sendMessageToAllClients({
                                type: 'llm-stream',
                                sessionId,
                                error: `Stream error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                done: true
                            });
                        } catch (e) {
                            log.error(`Failed to send error message: ${e}`);
                        }

                        // End the response if not already done
                        try {
                            if (!streamFinished) {
                                res.write(`data: ${JSON.stringify({ error: 'Stream error', done: true })}\n\n`);
                                res.end();
                            }
                        } catch (e) {
                            log.error(`Failed to end response: ${e}`);
                        }
                    }
                } : undefined
            };

            // Execute the pipeline
            const response = await pipeline.execute(pipelineInput);

            // Handle the response
            if (req.method === 'POST') {
                // Add assistant message to session
                session.messages.push({
                    role: 'assistant',
                    content: response.text || '',
                    timestamp: new Date()
                });

                // Return the response
                return {
                    content: response.text || '',
                    sources: (response as any).sources || []
                };
            } else {
                // For streaming requests, we've already sent the response
                return null;
            }
        } catch (processingError: any) {
            log.error(`Error processing message: ${processingError}`);
            return {
                error: `Error processing your request: ${processingError.message}`
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

        // Ensure tools are initialized to prevent tool execution issues
        await this.ensureToolsInitialized();

        // Log that we're calling contextService with the parameters
        log.info(`Using enhanced context with: noteId=${contextNoteId}, showThinking=${showThinking}`);

        // Correct parameters for contextService.processQuery
        const results = await contextService.processQuery(
            messageContent,
            service,
            {
                contextNoteId,
                showThinking
            }
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
        const aiMessages = await this.buildMessagesWithContext(
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
            stream: isStreamingRequest ? true : undefined,
            enableTools: true  // Explicitly enable tools
        };

        // Add a note indicating we're explicitly enabling tools
        log.info(`Advanced context flow: explicitly enabling tools in chat options`);

        // Process streaming responses differently
        if (isStreamingRequest) {
            // Handle streaming using the existing method
            await this.handleStreamingResponse(res, aiMessages, chatOptions, service, session);
        } else {
            // For non-streaming requests, generate a completion synchronously
            const response = await service.generateChatCompletion(aiMessages, chatOptions);

            // Check if the response contains tool calls
            if (response.tool_calls && response.tool_calls.length > 0) {
                log.info(`Advanced context non-streaming: detected ${response.tool_calls.length} tool calls in response`);
                log.info(`Tool calls details: ${JSON.stringify(response.tool_calls)}`);

                try {
                    let currentMessages = [...aiMessages];
                    let hasMoreToolCalls = true;
                    let iterationCount = 0;
                    const MAX_ITERATIONS = 3; // Prevent infinite loops

                    // Add initial assistant response with tool calls
                    currentMessages.push({
                        role: 'assistant',
                        content: response.text || '',
                        tool_calls: response.tool_calls
                    });

                    while (hasMoreToolCalls && iterationCount < MAX_ITERATIONS) {
                        iterationCount++;
                        log.info(`Tool iteration ${iterationCount}/${MAX_ITERATIONS}`);

                        // Execute the tools
                        const toolResults = await this.executeToolCalls(response);
                        log.info(`Successfully executed ${toolResults.length} tool calls in iteration ${iterationCount}`);

                        // Add tool results to messages
                        currentMessages = [...currentMessages, ...toolResults];

                        // Make a follow-up request with the tool results
                        log.info(`Making follow-up request with ${toolResults.length} tool results`);
                        const followUpOptions = { ...chatOptions, enableTools: iterationCount < MAX_ITERATIONS }; // Enable tools for follow-up but limit iterations
                        const followUpResponse = await service.generateChatCompletion(currentMessages, followUpOptions);

                        // Check if the follow-up response has more tool calls
                        if (followUpResponse.tool_calls && followUpResponse.tool_calls.length > 0) {
                            log.info(`Follow-up response has ${followUpResponse.tool_calls.length} more tool calls`);

                            // Add this response to messages for next iteration
                            currentMessages.push({
                                role: 'assistant',
                                content: followUpResponse.text || '',
                                tool_calls: followUpResponse.tool_calls
                            });

                            // Update response for next iteration
                            response.tool_calls = followUpResponse.tool_calls;
                        } else {
                            // No more tool calls, add final response and break loop
                            log.info(`No more tool calls in follow-up response`);
                            hasMoreToolCalls = false;

                            // Update the session with the final response
                            session.messages.push({
                                role: 'assistant',
                                content: followUpResponse.text || '',
                                timestamp: new Date()
                            });
                        }
                    }

                    // If we reached the max iterations, add the last response
                    if (iterationCount >= MAX_ITERATIONS && hasMoreToolCalls) {
                        log.info(`Reached maximum tool iteration limit of ${MAX_ITERATIONS}`);

                        // Get the last response we received
                        const lastResponse = currentMessages
                            .filter(msg => msg.role === 'assistant')
                            .pop();

                        if (lastResponse) {
                            session.messages.push({
                                role: 'assistant',
                                content: lastResponse.content || '',
                                timestamp: new Date()
                            });
                        }
                    }
                } catch (toolError: any) {
                    log.error(`Error executing tools in advanced context: ${toolError.message}`);

                    // Add error response to session
                    session.messages.push({
                        role: 'assistant',
                        content: `Error executing tools: ${toolError.message}`,
                        timestamp: new Date()
                    });
                }
            } else {
                // No tool calls, just add the response to the session
                session.messages.push({
                    role: 'assistant',
                    content: response.text || '',
                    timestamp: new Date()
                });
            }
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
        const aiMessages = await this.buildMessagesWithContext(
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
     * Handle streaming response via WebSocket
     *
     * This method processes LLM responses and sends them incrementally via WebSocket
     * to the client, supporting both text content and tool execution status updates.
     */
    private async handleStreamingResponse(
        res: Response,
        aiMessages: Message[],
        chatOptions: ChatCompletionOptions,
        service: any,
        session: ChatSession
    ) {
        // The client receives a success response for their HTTP request,
        // but the actual content will be streamed via WebSocket
        res.json({ success: true, message: 'Streaming response started' });

        // Import the WebSocket service
        const wsService = (await import('../../services/ws.js')).default;

        let messageContent = '';
        const sessionId = session.id;

        // Immediately send an initial message to confirm WebSocket connection is working
        // This helps prevent timeouts on the client side
        wsService.sendMessageToAllClients({
            type: 'llm-stream',
            sessionId,
            thinking: 'Preparing response...'
        } as LLMStreamMessage);

        try {
            // Generate the LLM completion with streaming enabled
            const response = await service.generateChatCompletion(aiMessages, {
                ...chatOptions,
                stream: true
            });

            // If the model doesn't support streaming via .stream() method or returns tool calls,
            // we'll handle it specially
            if (response.tool_calls && response.tool_calls.length > 0) {
                // Send thinking state notification via WebSocket
                wsService.sendMessageToAllClients({
                    type: 'llm-stream',
                    sessionId,
                    thinking: 'Analyzing tools needed for this request...'
                } as LLMStreamMessage);

                try {
                    // Execute the tools
                    const toolResults = await this.executeToolCalls(response);

                    // For each tool execution, send progress update via WebSocket
                    for (const toolResult of toolResults) {
                        wsService.sendMessageToAllClients({
                            type: 'llm-stream',
                            sessionId,
                            toolExecution: {
                                action: 'complete',
                                tool: toolResult.name || 'unknown',
                                result: toolResult.content.substring(0, 100) + (toolResult.content.length > 100 ? '...' : '')
                            }
                        } as LLMStreamMessage);
                    }

                    // Make follow-up request with tool results
                    const toolMessages = [...aiMessages, {
                        role: 'assistant',
                        content: response.text || '',
                        tool_calls: response.tool_calls
                    }, ...toolResults];

                    // Preserve streaming for follow-up if it was enabled in the original request
                    const followUpOptions = {
                        ...chatOptions,
                        // Only disable streaming if it wasn't explicitly requested
                        stream: chatOptions.stream === true,
                        // Allow tools but track iterations to prevent infinite loops
                        enableTools: true,
                        maxToolIterations: chatOptions.maxToolIterations || 5,
                        currentToolIteration: 1 // Start counting tool iterations
                    };

                    const followUpResponse = await service.generateChatCompletion(toolMessages, followUpOptions);

                    // Handle streaming follow-up response if streaming is enabled
                    if (followUpOptions.stream && followUpResponse.stream) {
                        log.info(`Streaming follow-up response after tool execution`);
                        let followUpContent = '';

                        // Process the streaming response
                        await followUpResponse.stream(async (chunk: StreamChunk) => {
                            if (chunk.text) {
                                followUpContent += chunk.text;

                                // Send each chunk via WebSocket
                                wsService.sendMessageToAllClients({
                                    type: 'llm-stream',
                                    sessionId,
                                    content: chunk.text
                                } as LLMStreamMessage);
                            }

                            // Signal completion when done
                            if (chunk.done) {
                                // Check if there are more tool calls to execute
                                if (followUpResponse.tool_calls && followUpResponse.tool_calls.length > 0 &&
                                    followUpOptions.currentToolIteration < followUpOptions.maxToolIterations) {

                                    log.info(`Found ${followUpResponse.tool_calls.length} more tool calls in iteration ${followUpOptions.currentToolIteration}`);

                                    // Execute these tool calls in another iteration
                                    // First, capture the current content for the assistant message
                                    const assistantMessage = {
                                        role: 'assistant' as const,
                                        content: followUpContent,
                                        tool_calls: followUpResponse.tool_calls
                                    };

                                    // Execute the tools from this follow-up
                                    const nextToolResults = await this.executeToolCalls(followUpResponse);

                                    // Create a new messages array with the latest tool results
                                    const nextToolMessages = [...toolMessages, assistantMessage, ...nextToolResults];

                                    // Increment the tool iteration counter for the next call
                                    const nextFollowUpOptions = {
                                        ...followUpOptions,
                                        currentToolIteration: followUpOptions.currentToolIteration + 1
                                    };

                                    log.info(`Making another follow-up request with ${nextToolResults.length} tool results (iteration ${nextFollowUpOptions.currentToolIteration}/${nextFollowUpOptions.maxToolIterations})`);

                                    // Make another follow-up request
                                    const nextResponse = await service.generateChatCompletion(nextToolMessages, nextFollowUpOptions);

                                    // Handle this new response (recursive streaming if needed)
                                    if (nextFollowUpOptions.stream && nextResponse.stream) {
                                        let nextContent = followUpContent; // Start with the existing content

                                        await nextResponse.stream(async (nextChunk: StreamChunk) => {
                                            if (nextChunk.text) {
                                                nextContent += nextChunk.text;

                                                // Stream this content to the client
                                                wsService.sendMessageToAllClients({
                                                    type: 'llm-stream',
                                                    sessionId,
                                                    content: nextChunk.text
                                                } as LLMStreamMessage);
                                            }

                                            if (nextChunk.done) {
                                                // Final completion message
                                                wsService.sendMessageToAllClients({
                                                    type: 'llm-stream',
                                                    sessionId,
                                                    done: true
                                                } as LLMStreamMessage);

                                                // Update message content with the complete response after all iterations
                                                messageContent = nextContent;

                                                // Store in session history
                                                session.messages.push({
                                                    role: 'assistant',
                                                    content: messageContent,
                                                    timestamp: new Date()
                                                });
                                            }
                                        });
                                    } else {
                                        // For non-streaming next response
                                        messageContent = nextResponse.text || "";

                                        // Send the final complete message
                                        wsService.sendMessageToAllClients({
                                            type: 'llm-stream',
                                            sessionId,
                                            content: messageContent,
                                            done: true
                                        } as LLMStreamMessage);

                                        // Store in session
                                        session.messages.push({
                                            role: 'assistant',
                                            content: messageContent,
                                            timestamp: new Date()
                                        });
                                    }
                                } else {
                                    // No more tool calls or reached iteration limit
                                    wsService.sendMessageToAllClients({
                                        type: 'llm-stream',
                                        sessionId,
                                        done: true
                                    } as LLMStreamMessage);

                                    // Update message content for session storage
                                    messageContent = followUpContent;

                                    // Store the final response in the session
                                    session.messages.push({
                                        role: 'assistant',
                                        content: messageContent,
                                        timestamp: new Date()
                                    });
                                }
                            }
                        });
                    } else {
                        // Non-streaming follow-up handling (original behavior)
                        messageContent = followUpResponse.text || "";

                        // Check if there are more tool calls to execute
                        if (followUpResponse.tool_calls && followUpResponse.tool_calls.length > 0 &&
                            followUpOptions.currentToolIteration < (followUpOptions.maxToolIterations || 5)) {

                            log.info(`Found ${followUpResponse.tool_calls.length} more tool calls in non-streaming follow-up (iteration ${followUpOptions.currentToolIteration})`);

                            // Execute these tool calls in another iteration
                            const assistantMessage = {
                                role: 'assistant' as const,
                                content: messageContent,
                                tool_calls: followUpResponse.tool_calls
                            };

                            // Execute the next round of tools
                            const nextToolResults = await this.executeToolCalls(followUpResponse);

                            // Create a new messages array with the latest tool results
                            const nextToolMessages = [...toolMessages, assistantMessage, ...nextToolResults];

                            // Increment the tool iteration counter for the next call
                            const nextFollowUpOptions = {
                                ...followUpOptions,
                                currentToolIteration: followUpOptions.currentToolIteration + 1
                            };

                            log.info(`Making another non-streaming follow-up request (iteration ${nextFollowUpOptions.currentToolIteration}/${nextFollowUpOptions.maxToolIterations || 5})`);

                            // Make another follow-up request
                            const nextResponse = await service.generateChatCompletion(nextToolMessages, nextFollowUpOptions);

                            // Update the message content with the final response
                            messageContent = nextResponse.text || "";
                        }

                        // Send the complete response with done flag in the same message
                        wsService.sendMessageToAllClients({
                            type: 'llm-stream',
                            sessionId,
                            content: messageContent,
                            done: true
                        } as LLMStreamMessage);

                        // Store the response in the session
                        session.messages.push({
                            role: 'assistant',
                            content: messageContent,
                            timestamp: new Date()
                        });
                    }

                    // Store the response in the session
                    session.messages.push({
                        role: 'assistant',
                        content: messageContent,
                        timestamp: new Date()
                    });

                    return;
                } catch (toolError) {
                    log.error(`Error executing tools: ${toolError}`);

                    // Send error via WebSocket with done flag
                    wsService.sendMessageToAllClients({
                        type: 'llm-stream',
                        sessionId,
                        error: `Error executing tools: ${toolError instanceof Error ? toolError.message : 'Unknown error'}`,
                        done: true
                    } as LLMStreamMessage);

                    return;
                }
            }

            // Handle standard streaming through the stream() method
            if (response.stream) {
                log.info(`Provider ${service.getName()} supports streaming via stream() method`);

                try {
                    await response.stream(async (chunk: StreamChunk) => {
                        if (chunk.text) {
                            messageContent += chunk.text;

                            // Enhanced logging for each chunk
                            log.info(`Received stream chunk from ${service.getName()} with ${chunk.text.length} chars of text, done=${!!chunk.done}`);

                            // Send each individual chunk via WebSocket as it arrives
                            wsService.sendMessageToAllClients({
                                type: 'llm-stream',
                                sessionId,
                                content: chunk.text,
                                done: !!chunk.done, // Include done flag with each chunk
                                // Include any raw data from the provider that might contain thinking/tool info
                                ...(chunk.raw ? { raw: chunk.raw } : {})
                            } as LLMStreamMessage);

                            // Log the first chunk (useful for debugging)
                            if (messageContent.length === chunk.text.length) {
                                log.info(`First stream chunk received from ${service.getName()}: "${chunk.text.substring(0, 50)}${chunk.text.length > 50 ? '...' : ''}"`);
                            }
                        }

                        // If the provider indicates this is "thinking" state, relay that
                        if (chunk.raw?.thinking) {
                            wsService.sendMessageToAllClients({
                                type: 'llm-stream',
                                sessionId,
                                thinking: chunk.raw.thinking
                            } as LLMStreamMessage);
                        }

                        // If the provider indicates tool execution, relay that
                        if (chunk.raw?.toolExecution) {
                            wsService.sendMessageToAllClients({
                                type: 'llm-stream',
                                sessionId,
                                toolExecution: chunk.raw.toolExecution
                            } as LLMStreamMessage);
                        }

                        // Signal completion when done
                        if (chunk.done) {
                            log.info(`Stream completed from ${service.getName()}, total content: ${messageContent.length} chars`);

                            // Only send final done message if it wasn't already sent with content
                            // This ensures we don't duplicate the content but still mark completion
                            if (!chunk.text) {
                                // Send final message with both content and done flag together
                                wsService.sendMessageToAllClients({
                                    type: 'llm-stream',
                                    sessionId,
                                    content: messageContent, // Send the accumulated content
                                    done: true
                                } as LLMStreamMessage);

                                log.info(`Sent explicit final completion message with accumulated content`);
                            } else {
                                log.info(`Final done flag was already sent with content chunk, no need for extra message`);
                            }
                        }
                    });

                    log.info(`Streaming from ${service.getName()} completed successfully`);
                } catch (streamError) {
                    log.error(`Error during streaming from ${service.getName()}: ${streamError}`);

                    // Report the error to the client
                    wsService.sendMessageToAllClients({
                        type: 'llm-stream',
                        sessionId,
                        error: `Error during streaming: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`,
                        done: true
                    } as LLMStreamMessage);

                    throw streamError;
                }
            } else {
                log.info(`Provider ${service.getName()} does not support streaming via stream() method, falling back to single response`);

                // If streaming isn't available, send the entire response at once
                messageContent = response.text || '';

                // Send via WebSocket - include both content and done flag in same message
                wsService.sendMessageToAllClients({
                    type: 'llm-stream',
                    sessionId,
                    content: messageContent,
                    done: true
                } as LLMStreamMessage);

                log.info(`Complete response sent for ${service.getName()}`);
            }

            // Store the full response in the session
            session.messages.push({
                role: 'assistant',
                content: messageContent,
                timestamp: new Date()
            });
        } catch (streamingError: any) {
            log.error(`Streaming error: ${streamingError.message}`);

            // Send error via WebSocket
            wsService.sendMessageToAllClients({
                type: 'llm-stream',
                sessionId,
                error: `Error generating response: ${streamingError instanceof Error ? streamingError.message : 'Unknown error'}`
            } as LLMStreamMessage);

            // Signal completion
            wsService.sendMessageToAllClients({
                type: 'llm-stream',
                sessionId,
                done: true
            } as LLMStreamMessage);
        }
    }

    /**
     * Execute tool calls from the LLM response
     * @param response The LLM response containing tool calls
     */
    private async executeToolCalls(response: any): Promise<Message[]> {
        log.info(`========== REST SERVICE TOOL EXECUTION FLOW ==========`);
        log.info(`Entered executeToolCalls method in REST chat service`);

        if (!response.tool_calls || response.tool_calls.length === 0) {
            log.info(`No tool calls to execute, returning early`);
            return [];
        }

        log.info(`Executing ${response.tool_calls.length} tool calls from REST chat service`);

        // Import tool registry directly to avoid circular dependencies
        const toolRegistry = (await import('./tools/tool_registry.js')).default;

        // Check if tools are available
        const availableTools = toolRegistry.getAllTools();
        log.info(`Available tools in registry: ${availableTools.length}`);

        if (availableTools.length === 0) {
            log.error('No tools available in registry for execution');

            // Try to initialize tools
            try {
                // Tools are already initialized in the AIServiceManager constructor
                // No need to initialize them again
                const tools = toolRegistry.getAllTools();
                log.info(`Successfully registered ${tools.length} LLM tools: ${tools.map(t => t.definition.function.name).join(', ')}`);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                log.error(`Failed to initialize tools: ${errorMessage}`);
                throw new Error('Tool execution failed: No tools available');
            }
        }

        // Execute each tool call and collect results
        const toolResults = await Promise.all(response.tool_calls.map(async (toolCall: any) => {
            try {
                log.info(`Executing tool: ${toolCall.function.name}, ID: ${toolCall.id || 'unknown'}`);

                // Get the tool from registry
                const tool = toolRegistry.getTool(toolCall.function.name);
                if (!tool) {
                    throw new Error(`Tool not found: ${toolCall.function.name}`);
                }

                // Parse arguments
                let args;
                if (typeof toolCall.function.arguments === 'string') {
                    try {
                        args = JSON.parse(toolCall.function.arguments);
                    } catch (e: unknown) {
                        log.error(`Failed to parse tool arguments: ${e instanceof Error ? e.message : String(e)}`);

                        // Try cleanup and retry
                        try {
                            const cleaned = toolCall.function.arguments
                                .replace(/^['"]|['"]$/g, '') // Remove surrounding quotes
                                .replace(/\\"/g, '"')        // Replace escaped quotes
                                .replace(/([{,])\s*'([^']+)'\s*:/g, '$1"$2":') // Replace single quotes around property names
                                .replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');    // Add quotes around unquoted property names

                            args = JSON.parse(cleaned);
                        } catch (cleanErr) {
                            // If all parsing fails, use as-is
                            args = { text: toolCall.function.arguments };
                        }
                    }
                } else {
                    args = toolCall.function.arguments;
                }

                // Log what we're about to execute
                log.info(`Executing tool with arguments: ${JSON.stringify(args)}`);

                // Execute the tool and get result
                const startTime = Date.now();
                const result = await tool.execute(args);
                const executionTime = Date.now() - startTime;

                log.info(`Tool execution completed in ${executionTime}ms`);

                // Log the result
                const resultPreview = typeof result === 'string'
                    ? result.substring(0, 100) + (result.length > 100 ? '...' : '')
                    : JSON.stringify(result).substring(0, 100) + '...';
                log.info(`Tool result: ${resultPreview}`);

                // Format result as a proper message
                return {
                    role: 'tool',
                    content: typeof result === 'string' ? result : JSON.stringify(result),
                    name: toolCall.function.name,
                    tool_call_id: toolCall.id || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                };
            } catch (error: any) {
                log.error(`Error executing tool ${toolCall.function.name}: ${error.message}`);

                // Return error as tool result
                return {
                    role: 'tool',
                    content: `Error: ${error.message}`,
                    name: toolCall.function.name,
                    tool_call_id: toolCall.id || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                };
            }
        }));

        log.info(`Completed execution of ${toolResults.length} tools`);
        return toolResults;
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

    /**
     * Ensure LLM tools are initialized
     */
    private async ensureToolsInitialized() {
        try {
            log.info("Checking LLM tool initialization...");

            // Import tool registry
            const toolRegistry = (await import('./tools/tool_registry.js')).default;

            // Check if tools are already initialized
            const registeredTools = toolRegistry.getAllTools();

            if (registeredTools.length === 0) {
                log.info("No tools found in registry.");
                log.info("Note: Tools should be initialized in the AIServiceManager constructor.");

                // Create AI service manager instance to trigger tool initialization
                const aiServiceManager = (await import('./ai_service_manager.js')).default;
                aiServiceManager.getInstance();

                // Check again after AIServiceManager instantiation
                const tools = toolRegistry.getAllTools();
                log.info(`After AIServiceManager instantiation: ${tools.length} tools available`);
            } else {
                log.info(`LLM tools already initialized: ${registeredTools.length} tools available`);
            }

            // Get all available tools for logging
            const availableTools = toolRegistry.getAllTools().map(t => t.definition.function.name);
            log.info(`Available tools: ${availableTools.join(', ')}`);

            log.info("LLM tools initialized successfully: " + availableTools.length + " tools available");
            return true;
        } catch (error) {
            log.error(`Failed to initialize LLM tools: ${error}`);
            return false;
        }
    }

    // Function to build messages with context
    private async buildMessagesWithContext(
        messages: Message[],
        context: string,
        llmService: LLMServiceInterface
    ): Promise<Message[]> {
        try {
            if (!messages || messages.length === 0) {
                log.info('No messages provided to buildMessagesWithContext');
                return [];
            }

            if (!context || context.trim() === '') {
                log.info('No context provided to buildMessagesWithContext, returning original messages');
                return messages;
            }

            // Get the provider name, handling service classes and raw provider names
            let providerName: string;
            if (typeof llmService === 'string') {
                // If llmService is a string, assume it's the provider name
                providerName = llmService;
            } else if (llmService.constructor && llmService.constructor.name) {
                // Extract provider name from service class name (e.g., OllamaService -> ollama)
                providerName = llmService.constructor.name.replace('Service', '').toLowerCase();
            } else {
                // Fallback to default
                providerName = 'default';
            }

            log.info(`Using formatter for provider: ${providerName}`);

            // Get the appropriate formatter for this provider
            const formatter = formatMessages.getFormatter(providerName);

            // Format messages with context using the provider-specific formatter
            const formattedMessages = formatter.formatMessages(
                messages,
                undefined, // No system prompt override - use what's in the messages
                context
            );

            log.info(`Formatted ${messages.length} messages into ${formattedMessages.length} messages for ${providerName}`);

            return formattedMessages;
        } catch (error) {
            log.error(`Error building messages with context: ${error}`);
            // Fallback to original messages in case of error
            return messages;
        }
    }
}

// Create singleton instance
const restChatService = new RestChatService();
export default restChatService;
