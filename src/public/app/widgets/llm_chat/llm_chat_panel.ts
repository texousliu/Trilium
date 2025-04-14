/**
 * LLM Chat Panel Widget
 */
import BasicWidget from "../basic_widget.js";
import toastService from "../../services/toast.js";
import appContext from "../../components/app_context.js";
import server from "../../services/server.js";
import libraryLoader from "../../services/library_loader.js";

import { TPL, addMessageToChat, showSources, hideSources, showLoadingIndicator, hideLoadingIndicator } from "./ui.js";
import { formatMarkdown } from "./utils.js";
import { createChatSession, checkSessionExists, setupStreamingResponse, getDirectResponse } from "./communication.js";
import { extractInChatToolSteps } from "./message_processor.js";
import { validateEmbeddingProviders } from "./validation.js";
import type { MessageData, ToolExecutionStep, ChatData } from "./types.js";
import { applySyntaxHighlight } from "../../services/syntax_highlight.js";

// Import the LLM Chat CSS
(async function() {
    await libraryLoader.requireCss('stylesheets/llm_chat.css');
})();

export default class LlmChatPanel extends BasicWidget {
    private noteContextChatMessages!: HTMLElement;
    private noteContextChatForm!: HTMLFormElement;
    private noteContextChatInput!: HTMLTextAreaElement;
    private noteContextChatSendButton!: HTMLButtonElement;
    private chatContainer!: HTMLElement;
    private loadingIndicator!: HTMLElement;
    private sourcesList!: HTMLElement;
    private sourcesContainer!: HTMLElement;
    private sourcesCount!: HTMLElement;
    private useAdvancedContextCheckbox!: HTMLInputElement;
    private showThinkingCheckbox!: HTMLInputElement;
    private validationWarning!: HTMLElement;
    private sessionId: string | null = null;
    private currentNoteId: string | null = null;
    private _messageHandlerId: number | null = null;
    private _messageHandler: any = null;

    // Callbacks for data persistence
    private onSaveData: ((data: any) => Promise<void>) | null = null;
    private onGetData: (() => Promise<any>) | null = null;
    private messages: MessageData[] = [];
    private sources: Array<{noteId: string; title: string; similarity?: number; content?: string}> = [];
    private metadata: {
        model?: string;
        provider?: string;
        temperature?: number;
        maxTokens?: number;
        toolExecutions?: Array<{
            id: string;
            name: string;
            arguments: any;
            result: any;
            error?: string;
            timestamp: string;
        }>;
        lastUpdated?: string;
        usage?: {
            promptTokens?: number;
            completionTokens?: number;
            totalTokens?: number;
        };
    } = {
        model: 'default',
        temperature: 0.7,
        toolExecutions: []
    };

    // Public getters and setters for private properties
    public getCurrentNoteId(): string | null {
        return this.currentNoteId;
    }

    public setCurrentNoteId(noteId: string | null): void {
        this.currentNoteId = noteId;
    }

    public getMessages(): MessageData[] {
        return this.messages;
    }

    public setMessages(messages: MessageData[]): void {
        this.messages = messages;
    }

    public getSessionId(): string | null {
        return this.sessionId;
    }

    public setSessionId(sessionId: string | null): void {
        this.sessionId = sessionId;
    }

    public getNoteContextChatMessages(): HTMLElement {
        return this.noteContextChatMessages;
    }

    public clearNoteContextChatMessages(): void {
        this.noteContextChatMessages.innerHTML = '';
    }

    doRender() {
        this.$widget = $(TPL);

        const element = this.$widget[0];
        this.noteContextChatMessages = element.querySelector('.note-context-chat-messages') as HTMLElement;
        this.noteContextChatForm = element.querySelector('.note-context-chat-form') as HTMLFormElement;
        this.noteContextChatInput = element.querySelector('.note-context-chat-input') as HTMLTextAreaElement;
        this.noteContextChatSendButton = element.querySelector('.note-context-chat-send-button') as HTMLButtonElement;
        this.chatContainer = element.querySelector('.note-context-chat-container') as HTMLElement;
        this.loadingIndicator = element.querySelector('.loading-indicator') as HTMLElement;
        this.sourcesList = element.querySelector('.sources-list') as HTMLElement;
        this.sourcesContainer = element.querySelector('.sources-container') as HTMLElement;
        this.sourcesCount = element.querySelector('.sources-count') as HTMLElement;
        this.useAdvancedContextCheckbox = element.querySelector('.use-advanced-context-checkbox') as HTMLInputElement;
        this.showThinkingCheckbox = element.querySelector('.show-thinking-checkbox') as HTMLInputElement;
        this.validationWarning = element.querySelector('.provider-validation-warning') as HTMLElement;

        // Set up event delegation for the settings link
        this.validationWarning.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('settings-link') || target.closest('.settings-link')) {
                console.log('Settings link clicked, navigating to AI settings URL');
                window.location.href = '#root/_hidden/_options/_optionsAi';
            }
        });

        this.initializeEventListeners();

        return this.$widget;
    }

    cleanup() {
        console.log(`LlmChatPanel cleanup called, removing any active WebSocket subscriptions`);
        this._messageHandler = null;
        this._messageHandlerId = null;
    }

    /**
     * Set the callbacks for data persistence
     */
    setDataCallbacks(
        saveDataCallback: (data: any) => Promise<void>,
        getDataCallback: () => Promise<any>
    ) {
        this.onSaveData = saveDataCallback;
        this.onGetData = getDataCallback;
    }

    /**
     * Save current chat data to the note attribute
     */
    async saveCurrentData() {
        if (!this.onSaveData) {
            return;
        }

        try {
            // Extract current tool execution steps if any exist
            const toolSteps = extractInChatToolSteps(this.noteContextChatMessages);

            // Get tool executions from both UI and any cached executions in metadata
            let toolExecutions: Array<{
                id: string;
                name: string;
                arguments: any;
                result: any;
                error?: string;
                timestamp: string;
            }> = [];

            // First include any tool executions already in metadata (from streaming events)
            if (this.metadata?.toolExecutions && Array.isArray(this.metadata.toolExecutions)) {
                toolExecutions = [...this.metadata.toolExecutions];
                console.log(`Including ${toolExecutions.length} tool executions from metadata`);
            }

            // Also extract any visible tool steps from the UI
            const extractedExecutions = toolSteps.map(step => {
                // Parse tool execution information
                if (step.type === 'tool-execution') {
                    try {
                        const content = JSON.parse(step.content);
                        return {
                            id: content.toolCallId || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                            name: content.tool || 'unknown',
                            arguments: content.args || {},
                            result: content.result || {},
                            error: content.error,
                            timestamp: new Date().toISOString()
                        };
                    } catch (e) {
                        // If we can't parse it, create a basic record
                        return {
                            id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                            name: 'unknown',
                            arguments: {},
                            result: step.content,
                            timestamp: new Date().toISOString()
                        };
                    }
                } else if (step.type === 'result' && step.name) {
                    // Handle result steps with a name
                    return {
                        id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        name: step.name,
                        arguments: {},
                        result: step.content,
                        timestamp: new Date().toISOString()
                    };
                }
                return {
                    id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    name: 'unknown',
                    arguments: {},
                    result: 'Unrecognized tool step',
                    timestamp: new Date().toISOString()
                };
            });

            // Merge the tool executions, keeping only unique IDs
            const existingIds = new Set(toolExecutions.map((t: {id: string}) => t.id));
            for (const exec of extractedExecutions) {
                if (!existingIds.has(exec.id)) {
                    toolExecutions.push(exec);
                    existingIds.add(exec.id);
                }
            }

            const dataToSave: ChatData = {
                messages: this.messages,
                sessionId: this.sessionId,
                toolSteps: toolSteps,
                // Add sources if we have them
                sources: this.sources || [],
                // Add metadata
                metadata: {
                    model: this.metadata?.model || 'default',
                    provider: this.metadata?.provider || undefined,
                    temperature: this.metadata?.temperature || 0.7,
                    lastUpdated: new Date().toISOString(),
                    // Add tool executions
                    toolExecutions: toolExecutions
                }
            };

            console.log(`Saving chat data with sessionId: ${this.sessionId}, ${toolSteps.length} tool steps, ${this.sources?.length || 0} sources, ${toolExecutions.length} tool executions`);

            await this.onSaveData(dataToSave);
        } catch (error) {
            console.error('Failed to save chat data', error);
        }
    }

    /**
     * Load saved chat data from the note attribute
     */
    async loadSavedData(): Promise<boolean> {
        if (!this.onGetData) {
            return false;
        }

        try {
            const savedData = await this.onGetData() as ChatData;

            if (savedData?.messages?.length > 0) {
                // Load messages
                this.messages = savedData.messages;

                // Clear and rebuild the chat UI
                this.noteContextChatMessages.innerHTML = '';

                this.messages.forEach(message => {
                    const role = message.role as 'user' | 'assistant';
                    this.addMessageToChat(role, message.content);
                });

                // Restore tool execution steps if they exist
                if (savedData.toolSteps && Array.isArray(savedData.toolSteps) && savedData.toolSteps.length > 0) {
                    console.log(`Restoring ${savedData.toolSteps.length} saved tool steps`);
                    this.restoreInChatToolSteps(savedData.toolSteps);
                }

                // Load sources if available
                if (savedData.sources && Array.isArray(savedData.sources)) {
                    this.sources = savedData.sources;
                    console.log(`Loaded ${this.sources.length} sources from saved data`);

                    // Show sources in the UI if they exist
                    if (this.sources.length > 0) {
                        this.showSources(this.sources);
                    }
                }

                // Load metadata if available
                if (savedData.metadata) {
                    this.metadata = {
                        ...this.metadata,
                        ...savedData.metadata
                    };

                    // Ensure tool executions are loaded
                    if (savedData.metadata.toolExecutions && Array.isArray(savedData.metadata.toolExecutions)) {
                        console.log(`Loaded ${savedData.metadata.toolExecutions.length} tool executions from saved data`);

                        if (!this.metadata.toolExecutions) {
                            this.metadata.toolExecutions = [];
                        }

                        // Make sure we don't lose any tool executions
                        this.metadata.toolExecutions = savedData.metadata.toolExecutions;
                    }

                    console.log(`Loaded metadata from saved data:`, this.metadata);
                }

                // Load session ID if available
                if (savedData.sessionId) {
                    try {
                        // Verify the session still exists
                        const sessionExists = await checkSessionExists(savedData.sessionId);

                        if (sessionExists) {
                            console.log(`Restored session ${savedData.sessionId}`);
                            this.sessionId = savedData.sessionId;

                            // If we successfully restored a session, also fetch the latest session data
                            try {
                                const sessionData = await server.getWithSilentNotFound<{
                                    metadata?: {
                                        model?: string;
                                        provider?: string;
                                        temperature?: number;
                                        maxTokens?: number;
                                        toolExecutions?: Array<{
                                            id: string;
                                            name: string;
                                            arguments: any;
                                            result: any;
                                            error?: string;
                                            timestamp: string;
                                        }>;
                                        lastUpdated?: string;
                                        usage?: {
                                            promptTokens?: number;
                                            completionTokens?: number;
                                            totalTokens?: number;
                                        };
                                    };
                                    sources?: Array<{
                                        noteId: string;
                                        title: string;
                                        similarity?: number;
                                        content?: string;
                                    }>;
                                }>(`llm/sessions/${savedData.sessionId}`);

                                if (sessionData && sessionData.metadata) {
                                    // Update our metadata with the latest from the server
                                    this.metadata = {
                                        ...this.metadata,
                                        ...sessionData.metadata
                                    };
                                    console.log(`Updated metadata from server for session ${savedData.sessionId}`);

                                    // If server has sources, update those too
                                    if (sessionData.sources && sessionData.sources.length > 0) {
                                        this.sources = sessionData.sources;
                                    }
                                } else {
                                    // Session data is missing or incomplete, create a new session
                                    console.log(`Invalid or incomplete session data for ${savedData.sessionId}, creating a new session`);
                                    this.sessionId = null;
                                    await this.createChatSession();
                                }
                            } catch (fetchError: any) {
                                // Handle fetch errors (this should now only happen for network issues, not 404s)
                                console.warn(`Could not fetch latest session data: ${fetchError}`);
                                console.log(`Creating a new session after fetch error`);
                                this.sessionId = null;
                                await this.createChatSession();
                            }
                        } else {
                            console.log(`Saved session ${savedData.sessionId} not found, will create new one`);
                            this.sessionId = null;
                            await this.createChatSession();
                        }
                    } catch (error) {
                        console.log(`Error checking saved session ${savedData.sessionId}, creating a new one`);
                        this.sessionId = null;
                        await this.createChatSession();
                    }
                } else {
                    // No saved session ID, create a new one
                    this.sessionId = null;
                    await this.createChatSession();
                }

                return true;
            }
        } catch (error) {
            console.error('Failed to load saved chat data', error);
        }

        return false;
    }

    /**
     * Restore tool execution steps in the chat UI
     */
    private restoreInChatToolSteps(steps: ToolExecutionStep[]) {
        if (!steps || steps.length === 0) return;

        // Create the tool execution element
        const toolExecutionElement = document.createElement('div');
        toolExecutionElement.className = 'chat-tool-execution mb-3';

        // Insert before the assistant message if it exists
        const assistantMessage = this.noteContextChatMessages.querySelector('.assistant-message:last-child');
        if (assistantMessage) {
            this.noteContextChatMessages.insertBefore(toolExecutionElement, assistantMessage);
        } else {
            // Otherwise append to the end
            this.noteContextChatMessages.appendChild(toolExecutionElement);
        }

        // Fill with tool execution content
        toolExecutionElement.innerHTML = `
            <div class="tool-execution-container p-2 rounded mb-2">
                <div class="tool-execution-header d-flex align-items-center justify-content-between mb-2">
                    <div>
                        <i class="bx bx-code-block text-primary me-2"></i>
                        <span class="fw-bold">Tool Execution</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-link p-0 text-muted tool-execution-chat-clear" title="Clear tool execution history">
                        <i class="bx bx-x"></i>
                    </button>
                </div>
                <div class="tool-execution-chat-steps">
                    ${this.renderToolStepsHtml(steps)}
                </div>
            </div>
        `;

        // Add event listener for the clear button
        const clearButton = toolExecutionElement.querySelector('.tool-execution-chat-clear');
        if (clearButton) {
            clearButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toolExecutionElement.remove();
            });
        }
    }

    /**
     * Render HTML for tool execution steps
     */
    private renderToolStepsHtml(steps: ToolExecutionStep[]): string {
        if (!steps || steps.length === 0) return '';

        return steps.map(step => {
            let icon = 'bx-info-circle';
            let className = 'info';
            let content = '';

            if (step.type === 'executing') {
                icon = 'bx-code-block';
                className = 'executing';
                content = `<div>${step.content || 'Executing tools...'}</div>`;
            } else if (step.type === 'result') {
                icon = 'bx-terminal';
                className = 'result';
                content = `
                    <div>Tool: <strong>${step.name || 'unknown'}</strong></div>
                    <div class="mt-1 ps-3">${step.content || ''}</div>
                `;
            } else if (step.type === 'error') {
                icon = 'bx-error-circle';
                className = 'error';
                content = `
                    <div>Tool: <strong>${step.name || 'unknown'}</strong></div>
                    <div class="mt-1 ps-3 text-danger">${step.content || 'Error occurred'}</div>
                `;
            } else if (step.type === 'generating') {
                icon = 'bx-message-dots';
                className = 'generating';
                content = `<div>${step.content || 'Generating response...'}</div>`;
            }

            return `
                <div class="tool-step ${className} p-2 mb-2 rounded">
                    <div class="d-flex align-items-center">
                        <i class="bx ${icon} me-2"></i>
                        ${content}
                    </div>
                </div>
            `;
        }).join('');
    }

    async refresh() {
        if (!this.isVisible()) {
            return;
        }

        // Check for any provider validation issues when refreshing
        await validateEmbeddingProviders(this.validationWarning);

        // Get current note context if needed
        const currentActiveNoteId = appContext.tabManager.getActiveContext()?.note?.noteId || null;

        // If we're switching to a different note, we need to reset
        if (this.currentNoteId !== currentActiveNoteId) {
            console.log(`Note ID changed from ${this.currentNoteId} to ${currentActiveNoteId}, resetting chat panel`);

            // Reset the UI and data
            this.noteContextChatMessages.innerHTML = '';
            this.messages = [];
            this.sessionId = null;
            this.hideSources(); // Hide any sources from previous note

            // Update our current noteId
            this.currentNoteId = currentActiveNoteId;
        }

        // Always try to load saved data for the current note
        const hasSavedData = await this.loadSavedData();

        // Only create a new session if we don't have a session or saved data
        if (!this.sessionId || !hasSavedData) {
            // Create a new chat session
            await this.createChatSession();
        }
    }

    private async createChatSession() {
        // Check for validation issues first
        await validateEmbeddingProviders(this.validationWarning);

        try {
            const sessionId = await createChatSession();

            if (sessionId) {
                this.sessionId = sessionId;
            }
        } catch (error) {
            console.error('Failed to create chat session:', error);
            toastService.showError('Failed to create chat session');
        }
    }

    /**
     * Handle sending a user message to the LLM service
     */
    private async sendMessage(content: string) {
        if (!content.trim()) {
            return;
        }

        // Check for provider validation issues before sending
        await validateEmbeddingProviders(this.validationWarning);

        // Make sure we have a valid session
        if (!this.sessionId) {
            // If no session ID, create a new session
            await this.createChatSession();

            if (!this.sessionId) {
                // If still no session ID, show error and return
                console.error("Failed to create chat session");
                toastService.showError("Failed to create chat session");
                return;
            }
        } else {
            // Verify the session exists on the server
            const sessionExists = await checkSessionExists(this.sessionId);
            if (!sessionExists) {
                console.log(`Session ${this.sessionId} not found, creating a new one`);
                await this.createChatSession();

                if (!this.sessionId) {
                    // If still no session ID after attempted creation, show error and return
                    console.error("Failed to create chat session after session not found");
                    toastService.showError("Failed to create chat session");
                    return;
                }
            }
        }

        // Process the user message
        await this.processUserMessage(content);

        // Clear input and show loading state
        this.noteContextChatInput.value = '';
        showLoadingIndicator(this.loadingIndicator);
        this.hideSources();

        try {
            const useAdvancedContext = this.useAdvancedContextCheckbox.checked;
            const showThinking = this.showThinkingCheckbox.checked;

            // Add logging to verify parameters
            console.log(`Sending message with: useAdvancedContext=${useAdvancedContext}, showThinking=${showThinking}, noteId=${this.currentNoteId}, sessionId=${this.sessionId}`);

            // Create the message parameters
            const messageParams = {
                content,
                useAdvancedContext,
                showThinking
            };

            // Try websocket streaming (preferred method)
            try {
                await this.setupStreamingResponse(messageParams);
            } catch (streamingError) {
                console.warn("WebSocket streaming failed, falling back to direct response:", streamingError);

                // If streaming fails, fall back to direct response
                const handled = await this.handleDirectResponse(messageParams);
                if (!handled) {
                    // If neither method works, show an error
                    throw new Error("Failed to get response from server");
                }
            }
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    /**
     * Process a new user message - add to UI and save
     */
    private async processUserMessage(content: string) {
        // Add user message to the chat UI
        this.addMessageToChat('user', content);

        // Add to our local message array too
        this.messages.push({
            role: 'user',
            content,
            timestamp: new Date()
        });

        // Save to note
        this.saveCurrentData().catch(err => {
            console.error("Failed to save user message to note:", err);
        });
    }

    /**
     * Try to get a direct response from the server
     */
    private async handleDirectResponse(messageParams: any): Promise<boolean> {
        try {
            if (!this.sessionId) return false;

            // Get a direct response from the server
            const postResponse = await getDirectResponse(this.sessionId, messageParams);

            // If the POST request returned content directly, display it
            if (postResponse && postResponse.content) {
                // Store metadata from the response
                if (postResponse.metadata) {
                    console.log("Received metadata from response:", postResponse.metadata);
                    this.metadata = {
                        ...this.metadata,
                        ...postResponse.metadata
                    };
                }

                // Store sources from the response
                if (postResponse.sources && postResponse.sources.length > 0) {
                    console.log(`Received ${postResponse.sources.length} sources from response`);
                    this.sources = postResponse.sources;
                    this.showSources(postResponse.sources);
                }

                // Process the assistant response
                this.processAssistantResponse(postResponse.content, postResponse);

                hideLoadingIndicator(this.loadingIndicator);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error with direct response:", error);
            return false;
        }
    }

    /**
     * Process an assistant response - add to UI and save
     */
    private async processAssistantResponse(content: string, fullResponse?: any) {
        // Add the response to the chat UI
        this.addMessageToChat('assistant', content);

        // Add to our local message array too
        this.messages.push({
            role: 'assistant',
            content,
            timestamp: new Date()
        });

        // If we received tool execution information, add it to metadata
        if (fullResponse?.metadata?.toolExecutions) {
            console.log(`Storing ${fullResponse.metadata.toolExecutions.length} tool executions from response`);
            // Make sure our metadata has toolExecutions
            if (!this.metadata.toolExecutions) {
                this.metadata.toolExecutions = [];
            }

            // Add new tool executions
            this.metadata.toolExecutions = [
                ...this.metadata.toolExecutions,
                ...fullResponse.metadata.toolExecutions
            ];
        }

        // Save to note
        this.saveCurrentData().catch(err => {
            console.error("Failed to save assistant response to note:", err);
        });
    }

    /**
     * Set up streaming response via WebSocket
     */
    private async setupStreamingResponse(messageParams: any): Promise<void> {
        if (!this.sessionId) {
            throw new Error("No session ID available");
        }

        // Store tool executions captured during streaming
        const toolExecutionsCache: Array<{
            id: string;
            name: string;
            arguments: any;
            result: any;
            error?: string;
            timestamp: string;
        }> = [];

        return setupStreamingResponse(
            this.sessionId,
            messageParams,
            // Content update handler
            (content: string, isDone: boolean = false) => {
                this.updateStreamingUI(content, isDone);

                // Update session data with additional metadata when streaming is complete
                if (isDone) {
                    // Update our metadata with info from the server
                    server.get<{
                        metadata?: {
                            model?: string;
                            provider?: string;
                            temperature?: number;
                            maxTokens?: number;
                            toolExecutions?: Array<{
                                id: string;
                                name: string;
                                arguments: any;
                                result: any;
                                error?: string;
                                timestamp: string;
                            }>;
                            lastUpdated?: string;
                            usage?: {
                                promptTokens?: number;
                                completionTokens?: number;
                                totalTokens?: number;
                            };
                        };
                        sources?: Array<{
                            noteId: string;
                            title: string;
                            similarity?: number;
                            content?: string;
                        }>;
                    }>(`llm/sessions/${this.sessionId}`)
                        .then((sessionData) => {
                            console.log("Got updated session data:", sessionData);

                            // Store metadata
                            if (sessionData.metadata) {
                                this.metadata = {
                                    ...this.metadata,
                                    ...sessionData.metadata
                                };
                            }

                            // Store sources
                            if (sessionData.sources && sessionData.sources.length > 0) {
                                this.sources = sessionData.sources;
                                this.showSources(sessionData.sources);
                            }

                            // Make sure we include the cached tool executions
                            if (toolExecutionsCache.length > 0) {
                                console.log(`Including ${toolExecutionsCache.length} cached tool executions in metadata`);
                                if (!this.metadata.toolExecutions) {
                                    this.metadata.toolExecutions = [];
                                }

                                // Add any tool executions from our cache that aren't already in metadata
                                const existingIds = new Set((this.metadata.toolExecutions || []).map((t: {id: string}) => t.id));
                                for (const toolExec of toolExecutionsCache) {
                                    if (!existingIds.has(toolExec.id)) {
                                        this.metadata.toolExecutions.push(toolExec);
                                        existingIds.add(toolExec.id);
                                    }
                                }
                            }

                            // Save the updated data to the note
                            this.saveCurrentData()
                                .catch(err => console.error("Failed to save data after streaming completed:", err));
                        })
                        .catch(err => console.error("Error fetching session data after streaming:", err));
                }
            },
            // Thinking update handler
            (thinking: string) => {
                this.showThinkingState(thinking);
            },
            // Tool execution handler
            (toolData: any) => {
                this.showToolExecutionInfo(toolData);

                // Cache tools we see during streaming to include them in the final saved data
                if (toolData && toolData.action === 'result' && toolData.tool) {
                    // Create a tool execution record
                    const toolExec = {
                        id: toolData.toolCallId || `tool-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        name: toolData.tool,
                        arguments: toolData.args || {},
                        result: toolData.result || {},
                        error: toolData.error,
                        timestamp: new Date().toISOString()
                    };

                    // Add to both our local cache for immediate saving and to metadata for later saving
                    toolExecutionsCache.push(toolExec);

                    // Initialize toolExecutions array if it doesn't exist
                    if (!this.metadata.toolExecutions) {
                        this.metadata.toolExecutions = [];
                    }

                    // Add tool execution to our metadata
                    this.metadata.toolExecutions.push(toolExec);

                    console.log(`Cached tool execution for ${toolData.tool} to be saved later`);

                    // Save immediately after receiving a tool execution
                    // This ensures we don't lose tool execution data if streaming fails
                    this.saveCurrentData().catch(err => {
                        console.error("Failed to save tool execution data:", err);
                    });
                }
            },
            // Complete handler
            () => {
                hideLoadingIndicator(this.loadingIndicator);
            },
            // Error handler
            (error: Error) => {
                this.handleError(error);
            }
        );
    }

    /**
     * Update the UI with streaming content
     */
    private updateStreamingUI(assistantResponse: string, isDone: boolean = false) {
        const logId = `LlmChatPanel-${Date.now()}`;
        console.log(`[${logId}] Updating UI with response text: ${assistantResponse.length} chars, isDone=${isDone}`);

        if (!this.noteContextChatMessages) {
            console.error(`[${logId}] noteContextChatMessages element not available`);
            return;
        }

        // With our new structured message approach, we don't need to extract tool steps from
        // the assistantResponse anymore, as tool execution is handled separately via dedicated messages

        // Find existing assistant message or create one if needed
        let assistantElement = this.noteContextChatMessages.querySelector('.assistant-message:last-child .message-content');

        // Now update or create the assistant message with the response
        if (assistantResponse) {
            if (assistantElement) {
                console.log(`[${logId}] Found existing assistant message element, updating with response`);
                try {
                    // Format the response with markdown
                    const formattedResponse = formatMarkdown(assistantResponse);

                    // Update the content
                    assistantElement.innerHTML = formattedResponse || '';

                    // Apply syntax highlighting to any code blocks in the updated content
                    applySyntaxHighlight($(assistantElement as HTMLElement));

                    console.log(`[${logId}] Successfully updated existing element with response`);
                } catch (err) {
                    console.error(`[${logId}] Error updating existing element:`, err);
                    // Fallback to text content if HTML update fails
                    try {
                        assistantElement.textContent = assistantResponse;
                        console.log(`[${logId}] Fallback to text content successful`);
                    } catch (fallbackErr) {
                        console.error(`[${logId}] Even fallback update failed:`, fallbackErr);
                    }
                }
            } else {
                console.log(`[${logId}] No existing assistant message element found, creating new one`);
                // Create a new message in the chat
                this.addMessageToChat('assistant', assistantResponse);
                console.log(`[${logId}] Successfully added new assistant message`);
            }

            // Update messages array only if this is the first update or the final update
            if (!this.messages.some(m => m.role === 'assistant') || isDone) {
                // Add or update the assistant message in our local array
                const existingIndex = this.messages.findIndex(m => m.role === 'assistant');
                if (existingIndex >= 0) {
                    // Update existing message
                    this.messages[existingIndex].content = assistantResponse;
                } else {
                    // Add new message
                    this.messages.push({
                        role: 'assistant',
                        content: assistantResponse,
                        timestamp: new Date()
                    });
                }

                // If this is the final update, save the data
                if (isDone) {
                    console.log(`[${logId}] Streaming finished, saving data to note`);
                    this.saveCurrentData().catch(err => {
                        console.error(`[${logId}] Failed to save streaming response to note:`, err);
                    });
                }
            }
        }

        // Always try to scroll to the latest content
        try {
            if (this.chatContainer) {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
                console.log(`[${logId}] Scrolled to latest content`);
            }
        } catch (scrollErr) {
            console.error(`[${logId}] Error scrolling to latest content:`, scrollErr);
        }
    }

    /**
     * Handle general errors in the send message flow
     */
    private handleError(error: Error) {
        hideLoadingIndicator(this.loadingIndicator);
        toastService.showError('Error sending message: ' + error.message);
    }

    private addMessageToChat(role: 'user' | 'assistant', content: string) {
        addMessageToChat(this.noteContextChatMessages, this.chatContainer, role, content);
    }

    private showSources(sources: Array<{noteId: string, title: string}>) {
        showSources(
            this.sourcesList,
            this.sourcesContainer,
            this.sourcesCount,
            sources,
            (noteId: string) => {
                // Open the note in a new tab but don't switch to it
                appContext.tabManager.openTabWithNoteWithHoisting(noteId, { activate: false });
            }
        );
    }

    private hideSources() {
        hideSources(this.sourcesContainer);
    }

    /**
     * Handle tool execution updates
     */
    private showToolExecutionInfo(toolExecutionData: any) {
        console.log(`Showing tool execution info: ${JSON.stringify(toolExecutionData)}`);
        
        // Enhanced debugging for tool execution
        if (!toolExecutionData) {
            console.error('Tool execution data is missing or undefined');
            return;
        }
        
        // Check for required properties
        const actionType = toolExecutionData.action || '';
        const toolName = toolExecutionData.tool || 'unknown';
        console.log(`Tool execution details: action=${actionType}, tool=${toolName}, hasResult=${!!toolExecutionData.result}`);
        
        // Force action to 'result' if missing but result is present
        if (!actionType && toolExecutionData.result) {
            console.log('Setting missing action to "result" since result is present');
            toolExecutionData.action = 'result';
        }

        // Create or get the tool execution container
        let toolExecutionElement = this.noteContextChatMessages.querySelector('.chat-tool-execution');
        if (!toolExecutionElement) {
            toolExecutionElement = document.createElement('div');
            toolExecutionElement.className = 'chat-tool-execution mb-3';

            // Create header with title and controls
            const header = document.createElement('div');
            header.className = 'tool-execution-header d-flex align-items-center p-2 rounded';
            header.innerHTML = `
                <i class="bx bx-terminal me-2"></i>
                <span class="flex-grow-1">Tool Execution</span>
                <button type="button" class="btn btn-sm btn-link p-0 text-muted tool-execution-chat-clear" title="Clear tool execution history">
                    <i class="bx bx-x"></i>
                </button>
            `;
            toolExecutionElement.appendChild(header);

            // Add click handler for clear button
            const clearButton = toolExecutionElement.querySelector('.tool-execution-chat-clear');
            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    const stepsContainer = toolExecutionElement?.querySelector('.tool-execution-container');
                    if (stepsContainer) {
                        stepsContainer.innerHTML = '';
                    }
                });
            }

            // Create container for tool steps
            const stepsContainer = document.createElement('div');
            stepsContainer.className = 'tool-execution-container p-2 rounded mb-2';
            toolExecutionElement.appendChild(stepsContainer);

            // Add to chat messages
            this.noteContextChatMessages.appendChild(toolExecutionElement);
        }

        // Get the steps container
        const stepsContainer = toolExecutionElement.querySelector('.tool-execution-container');
        if (!stepsContainer) return;

        // Process based on action type
        const action = toolExecutionData.action || '';

        if (action === 'start' || action === 'executing') {
            // Tool execution started
            const step = document.createElement('div');
            step.className = 'tool-step executing p-2 mb-2 rounded';
            step.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bx bx-code-block me-2"></i>
                    <span>Executing tool: <strong>${toolExecutionData.tool || 'unknown'}</strong></span>
                </div>
                ${toolExecutionData.args ? `
                <div class="tool-args mt-1 ps-3">
                    <code>Args: ${JSON.stringify(toolExecutionData.args || {}, null, 2)}</code>
                </div>` : ''}
            `;
            stepsContainer.appendChild(step);
        }
        else if (action === 'result' || action === 'complete') {
            // Tool execution completed with results
            const step = document.createElement('div');
            step.className = 'tool-step result p-2 mb-2 rounded';

            let resultDisplay = '';

            // Special handling for note search tools which have a specific structure
            if ((toolExecutionData.tool === 'search_notes' || toolExecutionData.tool === 'keyword_search_notes') &&
                typeof toolExecutionData.result === 'object' &&
                toolExecutionData.result.results) {

                const results = toolExecutionData.result.results;

                if (results.length === 0) {
                    resultDisplay = `<div class="text-muted">No notes found matching the search criteria.</div>`;
                } else {
                    resultDisplay = `
                        <div class="search-results">
                            <div class="mb-2">Found ${results.length} notes:</div>
                            <ul class="list-unstyled ps-1">
                                ${results.map((note: any) => `
                                    <li class="mb-1">
                                        <a href="#" class="note-link" data-note-id="${note.noteId}">${note.title}</a>
                                        ${note.similarity < 1 ? `<span class="text-muted small ms-1">(similarity: ${(note.similarity * 100).toFixed(0)}%)</span>` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `;
                }
            }
            // Format the result based on type for other tools
            else if (typeof toolExecutionData.result === 'object') {
                // For objects, format as pretty JSON
                resultDisplay = `<pre class="mb-0"><code>${JSON.stringify(toolExecutionData.result, null, 2)}</code></pre>`;
            } else {
                // For simple values, display as text
                resultDisplay = `<div>${String(toolExecutionData.result)}</div>`;
            }

            step.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bx bx-terminal me-2"></i>
                    <span>Tool: <strong>${toolExecutionData.tool || 'unknown'}</strong></span>
                </div>
                <div class="tool-result mt-1 ps-3">
                    ${resultDisplay}
                </div>
            `;
            stepsContainer.appendChild(step);

            // Add event listeners for note links if this is a note search result
            if (toolExecutionData.tool === 'search_notes' || toolExecutionData.tool === 'keyword_search_notes') {
                const noteLinks = step.querySelectorAll('.note-link');
                noteLinks.forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const noteId = (e.currentTarget as HTMLElement).getAttribute('data-note-id');
                        if (noteId) {
                            // Open the note in a new tab but don't switch to it
                            appContext.tabManager.openTabWithNoteWithHoisting(noteId, { activate: false });
                        }
                    });
                });
            }
        }
        else if (action === 'error') {
            // Tool execution failed
            const step = document.createElement('div');
            step.className = 'tool-step error p-2 mb-2 rounded';
            step.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bx bx-error-circle me-2"></i>
                    <span>Error in tool: <strong>${toolExecutionData.tool || 'unknown'}</strong></span>
                </div>
                <div class="tool-error mt-1 ps-3 text-danger">
                    ${toolExecutionData.error || 'Unknown error'}
                </div>
            `;
            stepsContainer.appendChild(step);
        }
        else if (action === 'generating') {
            // Generating final response with tool results
            const step = document.createElement('div');
            step.className = 'tool-step generating p-2 mb-2 rounded';
            step.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bx bx-message-dots me-2"></i>
                    <span>Generating response with tool results...</span>
                </div>
            `;
            stepsContainer.appendChild(step);
        }

        // Make sure the loading indicator is shown during tool execution
        this.loadingIndicator.style.display = 'flex';

        // Scroll the chat container to show the tool execution
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    /**
     * Show thinking state in the UI
     */
    private showThinkingState(thinkingData: string) {
        // Thinking state is now updated via the in-chat UI in updateStreamingUI
        // This method is now just a hook for the WebSocket handlers

        // Show the loading indicator
        this.loadingIndicator.style.display = 'flex';
    }

    private initializeEventListeners() {
        this.noteContextChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const content = this.noteContextChatInput.value;
            this.sendMessage(content);
        });

        // Add auto-resize functionality to the textarea
        this.noteContextChatInput.addEventListener('input', () => {
            this.noteContextChatInput.style.height = 'auto';
            this.noteContextChatInput.style.height = `${this.noteContextChatInput.scrollHeight}px`;
        });

        // Handle Enter key (send on Enter, new line on Shift+Enter)
        this.noteContextChatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.noteContextChatForm.dispatchEvent(new Event('submit'));
            }
        });
    }
}
