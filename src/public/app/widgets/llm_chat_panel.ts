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
            <div class="tool-execution-info mt-2" style="display: none;">
                <!-- Tool execution status will be shown here -->
                <div class="tool-execution-status small p-2 bg-light rounded" style="max-height: 150px; overflow-y: auto;">
                    <div class="d-flex align-items-center">
                        <i class="bx bx-code-block text-primary me-2"></i>
                        <span class="fw-bold">Tool Execution:</span>
                    </div>
                    <div class="tool-execution-steps ps-3 pt-1"></div>
                </div>
            </div>
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
    private toolExecutionInfo!: HTMLElement;
    private toolExecutionSteps!: HTMLElement;
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
        this.toolExecutionInfo = element.querySelector('.tool-execution-info') as HTMLElement;
        this.toolExecutionSteps = element.querySelector('.tool-execution-steps') as HTMLElement;
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
            const dataToSave = {
                messages: this.messages,
                sessionId: this.sessionId
            };

            console.log(`Saving chat data with sessionId: ${this.sessionId}`);

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
                        console.log(`Error checking saved session ${savedData.sessionId}, will create new one`);
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

        // Check if we already have an assistant message element to update
        const assistantElement = this.noteContextChatMessages.querySelector('.assistant-message:last-child .message-content');

        if (assistantElement) {
            console.log(`[${logId}] Found existing assistant message element, updating content`);
            try {
                // Format markdown and update the element
                const formattedContent = this.formatMarkdown(assistantResponse);

                // Ensure content is properly formatted
                if (!formattedContent || formattedContent.trim() === '') {
                    console.warn(`[${logId}] Formatted content is empty, using original content`);
                    assistantElement.textContent = assistantResponse;
                } else {
                    assistantElement.innerHTML = formattedContent;
                }

                // Apply syntax highlighting to any code blocks in the updated content
                applySyntaxHighlight($(assistantElement as HTMLElement));

                console.log(`[${logId}] Successfully updated existing element with ${formattedContent.length} chars of HTML`);
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
            try {
                this.addMessageToChat('assistant', assistantResponse);
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
                            ${assistantResponse}
                        </div>
                    `;
                    this.noteContextChatMessages.appendChild(emergencyElement);
                    console.log(`[${logId}] Emergency DOM update successful`);
                } catch (emergencyErr) {
                    console.error(`[${logId}] Emergency DOM update failed:`, emergencyErr);
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
        console.log(`[${logId}] Showing loading indicator and preparing tool execution display`);

        // Ensure elements exist before trying to modify them
        if (!this.loadingIndicator || !this.toolExecutionInfo || !this.toolExecutionSteps) {
            console.error(`[${logId}] UI elements not properly initialized`);
            return;
        }

        // Force display of loading indicator
        try {
            this.loadingIndicator.style.display = 'flex';

            // Make sure tool execution info area is always visible even before we get the first event
            // This helps avoid the UI getting stuck in "Processing..." state
            this.toolExecutionInfo.style.display = 'block';

            // Clear previous tool steps but add a placeholder
            this.toolExecutionSteps.innerHTML = `
                <div class="tool-step my-1">
                    <div class="d-flex align-items-center">
                        <i class="bx bx-loader-alt bx-spin text-primary me-1"></i>
                        <span>Initializing...</span>
                    </div>
                </div>
            `;

            // Force a UI update by accessing element properties
            const forceUpdate = this.loadingIndicator.offsetHeight;

            // Verify display states
            console.log(`[${logId}] Loading indicator display state: ${this.loadingIndicator.style.display}`);
            console.log(`[${logId}] Tool execution info display state: ${this.toolExecutionInfo.style.display}`);

            console.log(`[${logId}] Loading indicator and tool execution area initialized`);
        } catch (err) {
            console.error(`[${logId}] Error showing loading indicator:`, err);
        }
    }

    private hideLoadingIndicator() {
        const logId = `ui-${Date.now()}`;
        console.log(`[${logId}] Hiding loading indicator and tool execution area`);

        // Ensure elements exist before trying to modify them
        if (!this.loadingIndicator || !this.toolExecutionInfo) {
            console.error(`[${logId}] UI elements not properly initialized`);
            return;
        }

        // Properly reset DOM elements
        try {
            // First hide the tool execution info area
            this.toolExecutionInfo.style.display = 'none';

            // Force a UI update by accessing element properties
            const forceUpdate1 = this.toolExecutionInfo.offsetHeight;

            // Then hide the loading indicator
            this.loadingIndicator.style.display = 'none';

            // Force another UI update
            const forceUpdate2 = this.loadingIndicator.offsetHeight;

            // Verify display states immediately
            console.log(`[${logId}] Loading indicator display state: ${this.loadingIndicator.style.display}`);
            console.log(`[${logId}] Tool execution info display state: ${this.toolExecutionInfo.style.display}`);

            // Add a delay to double-check that UI updates are complete
            setTimeout(() => {
                console.log(`[${logId}] Verification after hide timeout: loading indicator display=${this.loadingIndicator.style.display}, tool execution info display=${this.toolExecutionInfo.style.display}`);

                // Force display none again in case something changed it
                if (this.loadingIndicator.style.display !== 'none') {
                    console.log(`[${logId}] Loading indicator still visible after timeout, forcing hidden`);
                    this.loadingIndicator.style.display = 'none';
                }

                if (this.toolExecutionInfo.style.display !== 'none') {
                    console.log(`[${logId}] Tool execution info still visible after timeout, forcing hidden`);
                    this.toolExecutionInfo.style.display = 'none';
                }
            }, 100);
        } catch (err) {
            console.error(`[${logId}] Error hiding loading indicator:`, err);
        }
    }

    /**
     * Show tool execution information in the UI
     */
    private showToolExecutionInfo(toolExecutionData: any) {
        console.log(`Showing tool execution info: ${JSON.stringify(toolExecutionData)}`);

        // Make sure tool execution info section is visible
        this.toolExecutionInfo.style.display = 'block';
        this.loadingIndicator.style.display = 'flex'; // Ensure loading indicator is shown during tool execution

        // Create a new step element to show the tool being executed
        const stepElement = document.createElement('div');
        stepElement.className = 'tool-step my-1';

        // Basic styling for the step
        let stepHtml = '';

        if (toolExecutionData.action === 'start') {
            // Tool execution starting
            stepHtml = `
                <div class="d-flex align-items-center">
                    <i class="bx bx-play-circle text-primary me-1"></i>
                    <span class="fw-bold">${this.escapeHtml(toolExecutionData.tool || 'Unknown tool')}</span>
                </div>
                <div class="tool-args small text-muted ps-3">
                    ${this.formatToolArgs(toolExecutionData.args || {})}
                </div>
            `;
        } else if (toolExecutionData.action === 'complete') {
            // Tool execution completed
            const resultPreview = this.formatToolResult(toolExecutionData.result);
            stepHtml = `
                <div class="d-flex align-items-center">
                    <i class="bx bx-check-circle text-success me-1"></i>
                    <span>${this.escapeHtml(toolExecutionData.tool || 'Unknown tool')} completed</span>
                </div>
                ${resultPreview ? `<div class="tool-result small ps-3 text-muted">${resultPreview}</div>` : ''}
            `;
        } else if (toolExecutionData.action === 'error') {
            // Tool execution error
            stepHtml = `
                <div class="d-flex align-items-center">
                    <i class="bx bx-error-circle text-danger me-1"></i>
                    <span class="text-danger">${this.escapeHtml(toolExecutionData.tool || 'Unknown tool')} error</span>
                </div>
                <div class="tool-error small text-danger ps-3">
                    ${this.escapeHtml(toolExecutionData.error || 'Unknown error')}
                </div>
            `;
        }

        if (stepHtml) {
            stepElement.innerHTML = stepHtml;
            this.toolExecutionSteps.appendChild(stepElement);

            // Scroll to bottom of tool execution steps
            this.toolExecutionSteps.scrollTop = this.toolExecutionSteps.scrollHeight;

            console.log(`Added new tool execution step to UI`);
        } else {
            console.log(`No HTML generated for tool execution data:`, toolExecutionData);
        }
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
     * Format tool results for display
     */
    private formatToolResult(result: any): string {
        if (result === undefined || result === null) return '';

        // Try to format as JSON if it's an object
        if (typeof result === 'object') {
            try {
                // Get a preview of structured data
                const entries = Object.entries(result);
                if (entries.length === 0) return 'Empty result';

                // Just show first 2 key-value pairs if there are many
                const preview = entries.slice(0, 2).map(([key, val]) => {
                    let valPreview;
                    if (typeof val === 'string') {
                        valPreview = val.length > 30 ? `"${val.substring(0, 27)}..."` : `"${val}"`;
                    } else if (Array.isArray(val)) {
                        valPreview = `[${val.length} items]`;
                    } else if (typeof val === 'object' && val !== null) {
                        valPreview = '{...}';
                    } else {
                        valPreview = String(val);
                    }
                    return `${key}: ${valPreview}`;
                }).join(', ');

                return entries.length > 2 ? `${preview}, ... (${entries.length} properties)` : preview;
            } catch (e) {
                return String(result).substring(0, 100) + (String(result).length > 100 ? '...' : '');
            }
        }

        // For string results
        if (typeof result === 'string') {
            return result.length > 100 ? result.substring(0, 97) + '...' : result;
        }

        // Default formatting
        return String(result).substring(0, 100) + (String(result).length > 100 ? '...' : '');
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
     * Show thinking state in the UI
     */
    private showThinkingState(thinkingData: string) {
        // Update the UI to show thinking indicator
        const thinking = typeof thinkingData === 'string' ? thinkingData : 'Thinking...';
        const toolExecutionStep = document.createElement('div');
        toolExecutionStep.className = 'tool-step my-1';
        toolExecutionStep.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bx bx-bulb text-warning me-1"></i>
                <span>${this.escapeHtml(thinking)}</span>
            </div>
        `;

        this.toolExecutionInfo.style.display = 'block';
        this.toolExecutionSteps.appendChild(toolExecutionStep);
        this.toolExecutionSteps.scrollTop = this.toolExecutionSteps.scrollHeight;
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