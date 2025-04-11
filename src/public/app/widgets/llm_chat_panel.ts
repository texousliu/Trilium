import BasicWidget from "./basic_widget.js";
import toastService from "../services/toast.js";
import server from "../services/server.js";
import appContext from "../components/app_context.js";
import utils from "../services/utils.js";
import { t } from "../services/i18n.js";
import libraryLoader from "../services/library_loader.js";
import { applySyntaxHighlight } from "../services/syntax_highlight.js";
import options from "../services/options.js";
import ws from "../services/ws.js";
import { marked } from "marked";

// Import the LLM Chat CSS
(async function() {
    await libraryLoader.requireCss('stylesheets/llm_chat.css');
})();

const TPL = `
<div class="note-context-chat h-100 w-100 d-flex flex-column">
    <!-- Move validation warning outside the card with better styling -->
    <div class="provider-validation-warning alert alert-warning m-2 border-left border-warning" style="display: none; padding-left: 15px; border-left: 4px solid #ffc107; background-color: rgba(255, 248, 230, 0.9); font-size: 0.9rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);"></div>

    <div class="note-context-chat-container flex-grow-1 overflow-auto p-3">
        <div class="note-context-chat-messages"></div>
        <div class="loading-indicator" style="display: none;">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-2">${t('ai_llm.agent.processing')}</span>
        </div>
    </div>

    <div class="sources-container p-2 border-top" style="display: none;">
        <h6 class="m-0 p-1 d-flex align-items-center">
            <i class="bx bx-link-alt me-1"></i> ${t('ai_llm.sources')}
            <span class="badge bg-primary rounded-pill ms-2 sources-count"></span>
        </h6>
        <div class="sources-list mt-2"></div>
    </div>

    <form class="note-context-chat-form d-flex flex-column border-top p-2">
        <div class="d-flex chat-input-container mb-2">
            <textarea
                class="form-control note-context-chat-input"
                placeholder="${t('ai_llm.enter_message')}"
                rows="2"
            ></textarea>
            <button type="submit" class="btn btn-primary note-context-chat-send-button ms-2 d-flex align-items-center justify-content-center">
                <i class="bx bx-send"></i>
            </button>
        </div>
        <div class="d-flex align-items-center context-option-container mt-1 justify-content-end">
            <small class="text-muted me-auto fst-italic">Options:</small>
            <div class="form-check form-switch me-3 small">
                <input class="form-check-input use-advanced-context-checkbox" type="checkbox" id="useEnhancedContext" checked>
                <label class="form-check-label small" for="useEnhancedContext" title="${t('ai.enhanced_context_description')}">
                    ${t('ai_llm.use_enhanced_context')}
                    <i class="bx bx-info-circle small text-muted"></i>
                </label>
            </div>
            <div class="form-check form-switch small">
                <input class="form-check-input show-thinking-checkbox" type="checkbox" id="showThinking">
                <label class="form-check-label small" for="showThinking" title="${t('ai.show_thinking_description')}">
                    ${t('ai_llm.show_thinking')}
                    <i class="bx bx-info-circle small text-muted"></i>
                </label>
            </div>
        </div>
    </form>
</div>
`;

interface ChatResponse {
    id: string;
    messages: Array<{role: string; content: string}>;
    sources?: Array<{noteId: string; title: string}>;
}

interface SessionResponse {
    id: string;
    title: string;
}

export default class LlmChatPanel extends BasicWidget {
    private noteContextChatMessages!: HTMLElement;
    private noteContextChatForm!: HTMLFormElement;
    private noteContextChatInput!: HTMLTextAreaElement;
    private noteContextChatSendButton!: HTMLButtonElement;
    private chatContainer!: HTMLElement;
    private loadingIndicator!: HTMLElement;
    private sourcesList!: HTMLElement;
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
    private messages: Array<{role: string; content: string; timestamp?: Date}> = [];

    // Public getters and setters for private properties
    public getCurrentNoteId(): string | null {
        return this.currentNoteId;
    }

    public setCurrentNoteId(noteId: string | null): void {
        this.currentNoteId = noteId;
    }

    public getMessages(): Array<{role: string; content: string; timestamp?: Date}> {
        return this.messages;
    }

    public setMessages(messages: Array<{role: string; content: string; timestamp?: Date}>): void {
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

        // Don't create a session here - wait for refresh
        // This prevents the wrong session from being created for the wrong note

        return this.$widget;
    }

    cleanup() {
        console.log(`LlmChatPanel cleanup called, removing any active WebSocket subscriptions`);

        // No need to manually clean up the event listeners, as they will be garbage collected
        // when the component is destroyed. We only need to clean up references.
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
            const toolSteps = this.extractInChatToolSteps();

            const dataToSave = {
                messages: this.messages,
                sessionId: this.sessionId,
                toolSteps: toolSteps // Save tool execution steps alongside messages
            };

            console.log(`Saving chat data with sessionId: ${this.sessionId} and ${toolSteps.length} tool steps`);

            await this.onSaveData(dataToSave);
        } catch (error) {
            console.error('Failed to save chat data', error);
        }
    }

    /**
     * Extract tool execution steps from the DOM that are within the chat flow
     */
    private extractInChatToolSteps(): Array<{type: string, name?: string, content: string}> {
        const steps: Array<{type: string, name?: string, content: string}> = [];

        // Look for tool execution in the chat flow
        const toolExecutionElement = this.noteContextChatMessages.querySelector('.chat-tool-execution');

        if (toolExecutionElement) {
            // Find all tool step elements
            const stepElements = toolExecutionElement.querySelectorAll('.tool-step');

            stepElements.forEach(stepEl => {
                const stepHtml = stepEl.innerHTML;

                // Determine the step type based on icons or classes present
                let type = 'info';
                let name: string | undefined;
                let content = '';

                if (stepHtml.includes('bx-code-block')) {
                    type = 'executing';
                    content = 'Executing tools...';
                } else if (stepHtml.includes('bx-terminal')) {
                    type = 'result';
                    // Extract the tool name from the step
                    const nameMatch = stepHtml.match(/<span[^>]*>Tool: ([^<]+)<\/span>/);
                    name = nameMatch ? nameMatch[1] : 'unknown';

                    // Extract the content from the div with class mt-1 ps-3
                    const contentEl = stepEl.querySelector('.mt-1.ps-3');
                    content = contentEl ? contentEl.innerHTML : '';
                } else if (stepHtml.includes('bx-error-circle')) {
                    type = 'error';
                    const nameMatch = stepHtml.match(/<span[^>]*>Tool: ([^<]+)<\/span>/);
                    name = nameMatch ? nameMatch[1] : 'unknown';

                    const contentEl = stepEl.querySelector('.mt-1.ps-3.text-danger');
                    content = contentEl ? contentEl.innerHTML : '';
                } else if (stepHtml.includes('bx-message-dots')) {
                    type = 'generating';
                    content = 'Generating response with tool results...';
                } else if (stepHtml.includes('bx-loader-alt')) {
                    // Skip the initializing spinner
                    return;
                }

                steps.push({ type, name, content });
            });
        }

        return steps;
    }

    /**
     * Load saved chat data from the note attribute
     */
    async loadSavedData(): Promise<boolean> {
        if (!this.onGetData) {
            return false;
        }

        try {
            const savedData = await this.onGetData();

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

                // Load session ID if available
                if (savedData.sessionId) {
                    try {
                        // Verify the session still exists
                        const sessionCheck = await server.get<any>(`llm/sessions/${savedData.sessionId}`);

                        if (sessionCheck && sessionCheck.id) {
                            console.log(`Restored session ${savedData.sessionId}`);
                            this.sessionId = savedData.sessionId;
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
    private restoreInChatToolSteps(steps: Array<{type: string, name?: string, content: string}>) {
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

    async refresh() {
        if (!this.isVisible()) {
            return;
        }

        // Check for any provider validation issues when refreshing
        await this.validateEmbeddingProviders();

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
        await this.validateEmbeddingProviders();

        try {
            const resp = await server.post<SessionResponse>('llm/sessions', {
                title: 'Note Chat'
            });

            if (resp && resp.id) {
                this.sessionId = resp.id;
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
        await this.validateEmbeddingProviders();

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
            try {
                const sessionCheck = await server.get<any>(`llm/sessions/${this.sessionId}`);
                if (!sessionCheck || !sessionCheck.id) {
                    console.log(`Session ${this.sessionId} not found, creating a new one`);
                    await this.createChatSession();
                }
            } catch (error) {
                console.log(`Error checking session ${this.sessionId}, creating a new one`);
                await this.createChatSession();
            }
        }

        // Process the user message
        await this.processUserMessage(content);

        // Clear input and show loading state
        this.noteContextChatInput.value = '';
        this.showLoadingIndicator();
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
     * @returns true if response was handled, false if streaming should be used
     */
    private async handleDirectResponse(messageParams: any): Promise<boolean> {
        try {
            // Create a copy of the params without any streaming flags
            const postParams = {
                ...messageParams,
                stream: false  // Explicitly set to false to ensure we get a direct response
            };

            console.log(`Sending direct POST request for session ${this.sessionId}`);

            // Send the message via POST request with the updated params
            const postResponse = await server.post<any>(`llm/sessions/${this.sessionId}/messages`, postParams);

            // If the POST request returned content directly, display it
            if (postResponse && postResponse.content) {
                this.processAssistantResponse(postResponse.content);

                // If there are sources, show them
                if (postResponse.sources && postResponse.sources.length > 0) {
                    this.showSources(postResponse.sources);
                }

                this.hideLoadingIndicator();
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
    private async processAssistantResponse(content: string) {
        // Add the response to the chat UI
        this.addMessageToChat('assistant', content);

        // Add to our local message array too
        this.messages.push({
            role: 'assistant',
            content,
            timestamp: new Date()
        });

        // Save to note
        this.saveCurrentData().catch(err => {
            console.error("Failed to save assistant response to note:", err);
        });
    }

    /**
     * Set up streaming response via WebSocket
     */
    private async setupStreamingResponse(messageParams: any): Promise<void> {
        const content = messageParams.content || '';
        const useAdvancedContext = messageParams.useAdvancedContext;
        const showThinking = messageParams.showThinking;

        return new Promise((resolve, reject) => {
            let assistantResponse = '';
            let receivedAnyContent = false;
            let timeoutId: number | null = null;
            let initialTimeoutId: number | null = null;
            let receivedAnyMessage = false;
            let eventListener: ((event: Event) => void) | null = null;

            // Create a unique identifier for this response process
            const responseId = `llm-stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            console.log(`[${responseId}] Setting up WebSocket streaming for session ${this.sessionId}`);

            // Create a message handler for CustomEvents
            eventListener = (event: Event) => {
                const customEvent = event as CustomEvent;
                const message = customEvent.detail;

                // Only process messages for our session
                if (!message || message.sessionId !== this.sessionId) {
                    return;
                }

                console.log(`[${responseId}] LLM Stream message received via CustomEvent: session=${this.sessionId}, content=${!!message.content}, contentLength=${message.content?.length || 0}, thinking=${!!message.thinking}, toolExecution=${!!message.toolExecution}, done=${!!message.done}`);

                // Mark first message received
                if (!receivedAnyMessage) {
                    receivedAnyMessage = true;
                    console.log(`[${responseId}] First message received for session ${this.sessionId}`);

                    // Clear the initial timeout since we've received a message
                    if (initialTimeoutId !== null) {
                        window.clearTimeout(initialTimeoutId);
                        initialTimeoutId = null;
                    }
                }

                // Handle content updates
                if (message.content) {
                    receivedAnyContent = true;
                    assistantResponse += message.content;

                    // Update the UI immediately
                    this.updateStreamingUI(assistantResponse);

                    // Reset timeout since we got content
                    if (timeoutId !== null) {
                        window.clearTimeout(timeoutId);
                    }

                    // Set new timeout
                    timeoutId = window.setTimeout(() => {
                        console.warn(`[${responseId}] Stream timeout for session ${this.sessionId}`);

                        // Save what we have
                        if (assistantResponse) {
                            console.log(`[${responseId}] Saving partial response due to timeout (${assistantResponse.length} chars)`);
                            this.messages.push({
                                role: 'assistant',
                                content: assistantResponse,
                                timestamp: new Date()
                            });
                            this.saveCurrentData().catch(err => {
                                console.error(`[${responseId}] Failed to save partial response:`, err);
                            });
                        }

                        // Clean up
                        this.cleanupEventListener(eventListener);
                        this.hideLoadingIndicator();
                        reject(new Error('Stream timeout'));
                    }, 30000);
                }

                // Handle tool execution updates
                if (message.toolExecution) {
                    console.log(`[${responseId}] Received tool execution update: action=${message.toolExecution.action || 'unknown'}`);
                    this.showToolExecutionInfo(message.toolExecution);
                    this.loadingIndicator.style.display = 'flex';
                }

                // Handle thinking state updates
                if (message.thinking) {
                    console.log(`[${responseId}] Received thinking update: ${message.thinking.substring(0, 50)}...`);
                    this.showThinkingState(message.thinking);
                    this.loadingIndicator.style.display = 'flex';
                }

                // Handle completion
                if (message.done) {
                    console.log(`[${responseId}] Stream completed for session ${this.sessionId}, has content: ${!!message.content}, content length: ${message.content?.length || 0}, current response: ${assistantResponse.length} chars`);

                    // Dump message content to console for debugging
                    if (message.content) {
                        console.log(`[${responseId}] CONTENT IN DONE MESSAGE (first 200 chars): "${message.content.substring(0, 200)}..."`);
                    }

                    // Clear timeout if set
                    if (timeoutId !== null) {
                        window.clearTimeout(timeoutId);
                        timeoutId = null;
                    }

                    // Check if we have content in the done message
                    // This is particularly important for Ollama which often sends the entire response in one message
                    if (message.content) {
                        console.log(`[${responseId}] Processing content in done message: ${message.content.length} chars`);
                        receivedAnyContent = true;

                        // Replace current response if we didn't have content before or if it's empty
                        if (assistantResponse.length === 0) {
                            console.log(`[${responseId}] Using content from done message as full response`);
                            assistantResponse = message.content;
                        }
                        // Otherwise append it if it's different
                        else if (message.content !== assistantResponse) {
                            console.log(`[${responseId}] Appending content from done message to existing response`);
                            assistantResponse += message.content;
                        }
                        else {
                            console.log(`[${responseId}] Content in done message is identical to existing response, not appending`);
                        }

                        this.updateStreamingUI(assistantResponse);
                    }

                    // Save the final response
                    if (assistantResponse) {
                        console.log(`[${responseId}] Saving final response of ${assistantResponse.length} chars`);
                        this.messages.push({
                            role: 'assistant',
                            content: assistantResponse,
                            timestamp: new Date()
                        });

                        this.saveCurrentData().catch(err => {
                            console.error(`[${responseId}] Failed to save final response:`, err);
                        });
                    } else {
                        // If we didn't receive any content at all, show a generic message
                        console.log(`[${responseId}] No content received for session ${this.sessionId}`);
                        const defaultMessage = 'I processed your request, but I don\'t have any specific information to share at the moment.';
                        this.processAssistantResponse(defaultMessage);
                    }

                    // Clean up and resolve
                    this.cleanupEventListener(eventListener);
                    this.hideLoadingIndicator();
                    resolve();
                }
            };

            // Register event listener for the custom event
            try {
                window.addEventListener('llm-stream-message', eventListener);
                console.log(`[${responseId}] Event listener added for llm-stream-message events`);
            } catch (err) {
                console.error(`[${responseId}] Error setting up event listener:`, err);
                reject(err);
                return;
            }

            // Set initial timeout for receiving any message
            initialTimeoutId = window.setTimeout(() => {
                console.warn(`[${responseId}] No messages received for initial period in session ${this.sessionId}`);
                if (!receivedAnyMessage) {
                    console.error(`[${responseId}] WebSocket connection not established for session ${this.sessionId}`);

                    if (timeoutId !== null) {
                        window.clearTimeout(timeoutId);
                    }

                    // Clean up
                    this.cleanupEventListener(eventListener);
                    this.hideLoadingIndicator();

                    // Show error message to user
                    const errorMessage = 'Connection error: Unable to establish WebSocket streaming.';
                    this.processAssistantResponse(errorMessage);
                    reject(new Error('WebSocket connection not established'));
                }
            }, 10000);

            // Send the streaming request to start the process
            console.log(`[${responseId}] Sending HTTP POST request to initiate streaming: /llm/sessions/${this.sessionId}/messages/stream`);
            server.post(`llm/sessions/${this.sessionId}/messages/stream`, {
                content,
                useAdvancedContext,
                showThinking,
                stream: true // Explicitly indicate this is a streaming request
            }).catch(err => {
                console.error(`[${responseId}] HTTP error sending streaming request for session ${this.sessionId}:`, err);

                // Clean up timeouts
                if (initialTimeoutId !== null) {
                    window.clearTimeout(initialTimeoutId);
                    initialTimeoutId = null;
                }

                if (timeoutId !== null) {
                    window.clearTimeout(timeoutId);
                    timeoutId = null;
                }

                // Clean up event listener
                this.cleanupEventListener(eventListener);

                reject(err);
            });
        });
    }

    /**
     * Clean up an event listener
     */
    private cleanupEventListener(listener: ((event: Event) => void) | null): void {
        if (listener) {
            try {
                window.removeEventListener('llm-stream-message', listener);
                console.log(`Successfully removed event listener`);
            } catch (err) {
                console.error(`Error removing event listener:`, err);
            }
        }
    }

    /**
     * Update the UI with streaming content as it arrives
     */
    private updateStreamingUI(assistantResponse: string) {
        const logId = `ui-update-${Date.now()}`;
        console.log(`[${logId}] Updating UI with response text: ${assistantResponse.length} chars`);

        if (!this.noteContextChatMessages) {
            console.error(`[${logId}] noteContextChatMessages element not available`);
            return;
        }

        // Extract the tool execution steps and final response
        const toolSteps = this.extractToolExecutionSteps(assistantResponse);
        const finalResponseText = this.extractFinalResponse(assistantResponse);

        // Find existing assistant message or create one if needed
        let assistantElement = this.noteContextChatMessages.querySelector('.assistant-message:last-child .message-content');

        // First, check if we need to add the tool execution steps to the chat flow
        if (toolSteps.length > 0) {
            // Look for an existing tool execution element in the chat flow
            let toolExecutionElement = this.noteContextChatMessages.querySelector('.chat-tool-execution');

            if (!toolExecutionElement) {
                // Create a new tool execution element in the chat flow
                // Place it right before the assistant message if it exists, or at the end of chat
                toolExecutionElement = document.createElement('div');
                toolExecutionElement.className = 'chat-tool-execution mb-3';

                // If there's an assistant message, insert before it
                const assistantMessage = this.noteContextChatMessages.querySelector('.assistant-message:last-child');
                if (assistantMessage) {
                    this.noteContextChatMessages.insertBefore(toolExecutionElement, assistantMessage);
                } else {
                    // Otherwise append to the end
                    this.noteContextChatMessages.appendChild(toolExecutionElement);
                }
            }

            // Update the tool execution content
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
                        ${this.renderToolStepsHtml(toolSteps)}
                    </div>
                </div>
            `;

            // Add event listener for the clear button
            const clearButton = toolExecutionElement.querySelector('.tool-execution-chat-clear');
            if (clearButton) {
                clearButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toolExecutionElement?.remove();
                });
            }
        }

        // Now update or create the assistant message with the final response
        if (finalResponseText) {
            if (assistantElement) {
                console.log(`[${logId}] Found existing assistant message element, updating with final response`);
                try {
                    // Format the final response with markdown
                    const formattedResponse = this.formatMarkdown(finalResponseText);

                    // Update the content
                    assistantElement.innerHTML = formattedResponse || '';

                    // Apply syntax highlighting to any code blocks in the updated content
                    applySyntaxHighlight($(assistantElement as HTMLElement));

                    console.log(`[${logId}] Successfully updated existing element with final response`);
                } catch (err) {
                    console.error(`[${logId}] Error updating existing element:`, err);
                    // Fallback to text content if HTML update fails
                    try {
                        assistantElement.textContent = finalResponseText;
                        console.log(`[${logId}] Fallback to text content successful`);
                    } catch (fallbackErr) {
                        console.error(`[${logId}] Even fallback update failed:`, fallbackErr);
                    }
                }
            } else {
                console.log(`[${logId}] No existing assistant message element found, creating new one`);
                try {
                    // Create new message element
                    const messageElement = document.createElement('div');
                    messageElement.className = 'chat-message assistant-message mb-3 d-flex';

                    const avatarElement = document.createElement('div');
                    avatarElement.className = 'message-avatar d-flex align-items-center justify-content-center me-2 assistant-avatar';
                    avatarElement.innerHTML = '<i class="bx bx-bot"></i>';

                    const contentElement = document.createElement('div');
                    contentElement.className = 'message-content p-3 rounded flex-grow-1 assistant-content';

                    // Only show the final response in the message content
                    contentElement.innerHTML = this.formatMarkdown(finalResponseText) || '';

                    messageElement.appendChild(avatarElement);
                    messageElement.appendChild(contentElement);

                    this.noteContextChatMessages.appendChild(messageElement);

                    // Apply syntax highlighting to any code blocks in the message
                    applySyntaxHighlight($(contentElement));

                    console.log(`[${logId}] Successfully added new assistant message`);
                } catch (err) {
                    console.error(`[${logId}] Error adding new message:`, err);

                    // Last resort emergency approach - create element directly
                    try {
                        console.log(`[${logId}] Attempting emergency DOM update`);
                        const emergencyElement = document.createElement('div');
                        emergencyElement.className = 'chat-message assistant-message mb-3 d-flex';
                        emergencyElement.innerHTML = `
                            <div class="message-avatar d-flex align-items-center justify-content-center me-2 assistant-avatar">
                                <i class="bx bx-bot"></i>
                            </div>
                            <div class="message-content p-3 rounded flex-grow-1 assistant-content">
                                ${finalResponseText}
                            </div>
                        `;
                        this.noteContextChatMessages.appendChild(emergencyElement);
                        console.log(`[${logId}] Emergency DOM update successful`);
                    } catch (emergencyErr) {
                        console.error(`[${logId}] Emergency DOM update failed:`, emergencyErr);
                    }
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
     * Render tool steps as HTML for display in chat
     */
    private renderToolStepsHtml(steps: Array<{type: string, name?: string, content: string}>): string {
        if (!steps || steps.length === 0) return '';

        let html = '';

        steps.forEach(step => {
            let icon, labelClass, content;

            switch (step.type) {
                case 'executing':
                    icon = 'bx-code-block text-primary';
                    labelClass = '';
                    content = `<div class="d-flex align-items-center">
                        <i class="bx ${icon} me-1"></i>
                        <span>${step.content}</span>
                    </div>`;
                    break;

                case 'result':
                    icon = 'bx-terminal text-success';
                    labelClass = 'fw-bold';
                    content = `<div class="d-flex align-items-center">
                        <i class="bx ${icon} me-1"></i>
                        <span class="${labelClass}">Tool: ${step.name || 'unknown'}</span>
                    </div>
                    <div class="mt-1 ps-3">${step.content}</div>`;
                    break;

                case 'error':
                    icon = 'bx-error-circle text-danger';
                    labelClass = 'fw-bold text-danger';
                    content = `<div class="d-flex align-items-center">
                        <i class="bx ${icon} me-1"></i>
                        <span class="${labelClass}">Tool: ${step.name || 'unknown'}</span>
                    </div>
                    <div class="mt-1 ps-3 text-danger">${step.content}</div>`;
                    break;

                case 'generating':
                    icon = 'bx-message-dots text-info';
                    labelClass = '';
                    content = `<div class="d-flex align-items-center">
                        <i class="bx ${icon} me-1"></i>
                        <span>${step.content}</span>
                    </div>`;
                    break;

                default:
                    icon = 'bx-info-circle text-muted';
                    labelClass = '';
                    content = `<div class="d-flex align-items-center">
                        <i class="bx ${icon} me-1"></i>
                        <span>${step.content}</span>
                    </div>`;
            }

            html += `<div class="tool-step my-1">${content}</div>`;
        });

        return html;
    }

    /**
     * Extract tool execution steps from the response
     */
    private extractToolExecutionSteps(content: string): Array<{type: string, name?: string, content: string}> {
        if (!content) return [];

        const steps = [];

        // Check for executing tools marker
        if (content.includes('[Executing tools...]')) {
            steps.push({
                type: 'executing',
                content: 'Executing tools...'
            });
        }

        // Extract tool results with regex
        const toolResultRegex = /\[Tool: ([^\]]+)\]([\s\S]*?)(?=\[|$)/g;
        let match;

        while ((match = toolResultRegex.exec(content)) !== null) {
            const toolName = match[1];
            const toolContent = match[2].trim();

            steps.push({
                type: toolContent.includes('Error:') ? 'error' : 'result',
                name: toolName,
                content: toolContent
            });
        }

        // Check for generating response marker
        if (content.includes('[Generating response with tool results...]')) {
            steps.push({
                type: 'generating',
                content: 'Generating response with tool results...'
            });
        }

        return steps;
    }

    /**
     * Extract the final response without tool execution steps
     */
    private extractFinalResponse(content: string): string {
        if (!content) return '';

        // Remove all tool execution markers and their content
        let finalResponse = content
            .replace(/\[Executing tools\.\.\.\]\n*/g, '')
            .replace(/\[Tool: [^\]]+\][\s\S]*?(?=\[|$)/g, '')
            .replace(/\[Generating response with tool results\.\.\.\]\n*/g, '');

        // Trim any extra whitespace
        finalResponse = finalResponse.trim();

        return finalResponse;
    }

    /**
     * Handle general errors in the send message flow
     */
    private handleError(error: Error) {
        this.hideLoadingIndicator();
        toastService.showError('Error sending message: ' + error.message);
    }

    private addMessageToChat(role: 'user' | 'assistant', content: string) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}-message mb-3 d-flex`;

        const avatarElement = document.createElement('div');
        avatarElement.className = 'message-avatar d-flex align-items-center justify-content-center me-2';

        if (role === 'user') {
            avatarElement.innerHTML = '<i class="bx bx-user"></i>';
            avatarElement.classList.add('user-avatar');
        } else {
            avatarElement.innerHTML = '<i class="bx bx-bot"></i>';
            avatarElement.classList.add('assistant-avatar');
        }

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content p-3 rounded flex-grow-1';

        if (role === 'user') {
            contentElement.classList.add('user-content', 'bg-light');
        } else {
            contentElement.classList.add('assistant-content');
        }

        // Format the content with markdown
        contentElement.innerHTML = this.formatMarkdown(content);

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(contentElement);

        this.noteContextChatMessages.appendChild(messageElement);

        // Apply syntax highlighting to any code blocks in the message
        applySyntaxHighlight($(contentElement));

        // Scroll to bottom
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    private showSources(sources: Array<{noteId: string, title: string}>) {
        this.sourcesList.innerHTML = '';

        // Update the sources count
        const sourcesCount = this.$widget[0].querySelector('.sources-count') as HTMLElement;
        if (sourcesCount) {
            sourcesCount.textContent = sources.length.toString();
        }

        sources.forEach(source => {
            const sourceElement = document.createElement('div');
            sourceElement.className = 'source-item p-2 mb-1 border rounded d-flex align-items-center';

            // Create the direct link to the note
            sourceElement.innerHTML = `
                <div class="d-flex align-items-center w-100">
                    <a href="#root/${source.noteId}"
                       data-note-id="${source.noteId}"
                       class="source-link text-truncate d-flex align-items-center"
                       title="Open note: ${source.title}">
                        <i class="bx bx-file-blank me-1"></i>
                        <span class="source-title">${source.title}</span>
                    </a>
                </div>`;

            // Add click handler for better user experience
            sourceElement.querySelector('.source-link')?.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Open the note in a new tab but don't switch to it
                appContext.tabManager.openTabWithNoteWithHoisting(source.noteId, { activate: false });

                return false; // Additional measure to prevent the event from bubbling up
            });

            this.sourcesList.appendChild(sourceElement);
        });

        const sourcesContainer = this.$widget[0].querySelector('.sources-container') as HTMLElement;
        if (sourcesContainer) {
            sourcesContainer.style.display = 'block';
        }
    }

    private hideSources() {
        const sourcesContainer = this.$widget[0].querySelector('.sources-container') as HTMLElement;
        if (sourcesContainer) {
            sourcesContainer.style.display = 'none';
        }
    }

    private showLoadingIndicator() {
        const logId = `ui-${Date.now()}`;
        console.log(`[${logId}] Showing loading indicator`);

        // Ensure the loading indicator element exists
        if (!this.loadingIndicator) {
            console.error(`[${logId}] Loading indicator element not properly initialized`);
            return;
        }

        // Show the loading indicator
        try {
            this.loadingIndicator.style.display = 'flex';

            // Force a UI update
            const forceUpdate = this.loadingIndicator.offsetHeight;

            console.log(`[${logId}] Loading indicator initialized`);
        } catch (err) {
            console.error(`[${logId}] Error showing loading indicator:`, err);
        }
    }

    private hideLoadingIndicator() {
        const logId = `ui-${Date.now()}`;
        console.log(`[${logId}] Hiding loading indicator`);

        // Ensure elements exist before trying to modify them
        if (!this.loadingIndicator) {
            console.error(`[${logId}] Loading indicator element not properly initialized`);
            return;
        }

        // Properly reset DOM elements
        try {
            // Hide just the loading indicator but NOT the tool execution info
            this.loadingIndicator.style.display = 'none';

            // Force a UI update by accessing element properties
            const forceUpdate = this.loadingIndicator.offsetHeight;

            // Tool execution info is now independent and may remain visible
            console.log(`[${logId}] Loading indicator hidden, tool execution info remains visible if needed`);
        } catch (err) {
            console.error(`[${logId}] Error hiding loading indicator:`, err);
        }
    }

    /**
     * Show tool execution information in the UI
     */
    private showToolExecutionInfo(toolExecutionData: any) {
        console.log(`Showing tool execution info: ${JSON.stringify(toolExecutionData)}`);

        // We'll update the in-chat tool execution area in the updateStreamingUI method
        // This method is now just a legacy hook for the WebSocket handlers

        // Make sure the loading indicator is shown during tool execution
        this.loadingIndicator.style.display = 'flex';
    }

    /**
     * Show thinking state in the UI
     */
    private showThinkingState(thinkingData: string) {
        // Thinking state is now updated via the in-chat UI in updateStreamingUI
        // This method is now just a legacy hook for the WebSocket handlers

        // Show the loading indicator
        this.loadingIndicator.style.display = 'flex';
    }

    /**
     * Format tool arguments for display
     */
    private formatToolArgs(args: any): string {
        if (!args || typeof args !== 'object') return '';

        return Object.entries(args)
            .map(([key, value]) => {
                // Format the value based on its type
                let displayValue;
                if (typeof value === 'string') {
                    displayValue = value.length > 50 ? `"${value.substring(0, 47)}..."` : `"${value}"`;
                } else if (value === null) {
                    displayValue = 'null';
                } else if (Array.isArray(value)) {
                    displayValue = '[...]'; // Simplified array representation
                } else if (typeof value === 'object') {
                    displayValue = '{...}'; // Simplified object representation
                } else {
                    displayValue = String(value);
                }

                return `<span class="text-primary">${this.escapeHtml(key)}</span>: ${this.escapeHtml(displayValue)}`;
            })
            .join(', ');
    }

    /**
     * Simple HTML escaping for safer content display
     */
    private escapeHtml(text: string): string {
        if (typeof text !== 'string') {
            text = String(text || '');
        }

        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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

    /**
     * Format markdown content for display
     */
    private formatMarkdown(content: string): string {
        if (!content) return '';

        // First, extract HTML thinking visualization to protect it from replacements
        const thinkingBlocks: string[] = [];
        let processedContent = content.replace(/<div class=['"](thinking-process|reasoning-process)['"][\s\S]*?<\/div>/g, (match) => {
            const placeholder = `__THINKING_BLOCK_${thinkingBlocks.length}__`;
            thinkingBlocks.push(match);
            return placeholder;
        });

        // Use marked library to parse the markdown
        const markedContent = marked(processedContent, {
            breaks: true,   // Convert line breaks to <br>
            gfm: true,      // Enable GitHub Flavored Markdown
            silent: true    // Ignore errors
        });

        // Handle potential promise (though it shouldn't be with our options)
        if (typeof markedContent === 'string') {
            processedContent = markedContent;
        } else {
            console.warn('Marked returned a promise unexpectedly');
            // Use the original content as fallback
            processedContent = content;
        }

        // Restore thinking visualization blocks
        thinkingBlocks.forEach((block, index) => {
            processedContent = processedContent.replace(`__THINKING_BLOCK_${index}__`, block);
        });

        return processedContent;
    }

    /**
     * Validate embedding providers configuration
     * Check if there are issues with the embedding providers that might affect LLM functionality
     */
    async validateEmbeddingProviders() {
        try {
            // Check if AI is enabled
            const aiEnabled = options.is('aiEnabled');
            if (!aiEnabled) {
                this.validationWarning.style.display = 'none';
                return;
            }

            // Get provider precedence
            const precedenceStr = options.get('aiProviderPrecedence') || 'openai,anthropic,ollama';
            let precedenceList: string[] = [];

            if (precedenceStr) {
                if (precedenceStr.startsWith('[') && precedenceStr.endsWith(']')) {
                    precedenceList = JSON.parse(precedenceStr);
                } else if (precedenceStr.includes(',')) {
                    precedenceList = precedenceStr.split(',').map(p => p.trim());
                } else {
                    precedenceList = [precedenceStr];
                }
            }

            // Get enabled providers - this is a simplification since we don't have direct DB access
            // We'll determine enabled status based on the presence of keys or settings
            const enabledProviders: string[] = [];

            // OpenAI is enabled if API key is set
            const openaiKey = options.get('openaiApiKey');
            if (openaiKey) {
                enabledProviders.push('openai');
            }

            // Anthropic is enabled if API key is set
            const anthropicKey = options.get('anthropicApiKey');
            if (anthropicKey) {
                enabledProviders.push('anthropic');
            }

            // Ollama is enabled if base URL is set
            const ollamaBaseUrl = options.get('ollamaBaseUrl');
            if (ollamaBaseUrl) {
                enabledProviders.push('ollama');
            }

            // Local is always available
            enabledProviders.push('local');

            // Perform validation checks
            const allPrecedenceEnabled = precedenceList.every((p: string) => enabledProviders.includes(p));

            // Get embedding queue status
            const embeddingStats = await server.get('llm/embeddings/stats') as {
                success: boolean,
                stats: {
                    totalNotesCount: number;
                    embeddedNotesCount: number;
                    queuedNotesCount: number;
                    failedNotesCount: number;
                    lastProcessedDate: string | null;
                    percentComplete: number;
                }
            };
            const queuedNotes = embeddingStats?.stats?.queuedNotesCount || 0;
            const hasEmbeddingsInQueue = queuedNotes > 0;

            // Show warning if there are issues
            if (!allPrecedenceEnabled || hasEmbeddingsInQueue) {
                let message = '<i class="bx bx-error-circle me-2"></i><strong>AI Provider Configuration Issues</strong>';

                message += '<ul class="mb-1 ps-4">';

                if (!allPrecedenceEnabled) {
                    const disabledProviders = precedenceList.filter((p: string) => !enabledProviders.includes(p));
                    message += `<li>The following providers in your precedence list are not enabled: ${disabledProviders.join(', ')}.</li>`;
                }

                if (hasEmbeddingsInQueue) {
                    message += `<li>Currently processing embeddings for ${queuedNotes} notes. Some AI features may produce incomplete results until processing completes.</li>`;
                }

                message += '</ul>';
                message += '<div class="mt-2"><a href="javascript:" class="settings-link btn btn-sm btn-outline-secondary"><i class="bx bx-cog me-1"></i>Open AI Settings</a></div>';

                // Update HTML content - no need to attach event listeners here anymore
                this.validationWarning.innerHTML = message;
                this.validationWarning.style.display = 'block';
            } else {
                this.validationWarning.style.display = 'none';
            }
        } catch (error) {
            console.error('Error validating embedding providers:', error);
            this.validationWarning.style.display = 'none';
        }
    }
}
