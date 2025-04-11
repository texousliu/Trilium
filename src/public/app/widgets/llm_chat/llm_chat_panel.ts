/**
 * LLM Chat Panel Widget
 */
import BasicWidget from "../basic_widget.js";
import toastService from "../../services/toast.js";
import appContext from "../../components/app_context.js";
import server from "../../services/server.js";
import libraryLoader from "../../services/library_loader.js";

import { TPL, addMessageToChat, showSources, hideSources, showLoadingIndicator, hideLoadingIndicator, renderToolStepsHtml } from "./ui.js";
import { formatMarkdown } from "./utils.js";
import { createChatSession, checkSessionExists, setupStreamingResponse, getDirectResponse } from "./communication.js";
import { extractToolExecutionSteps, extractFinalResponse, extractInChatToolSteps } from "./message_processor.js";
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

            const dataToSave: ChatData = {
                messages: this.messages,
                sessionId: this.sessionId,
                toolSteps: toolSteps
            };

            console.log(`Saving chat data with sessionId: ${this.sessionId} and ${toolSteps.length} tool steps`);

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

                // Load session ID if available
                if (savedData.sessionId) {
                    try {
                        // Verify the session still exists
                        const sessionExists = await checkSessionExists(savedData.sessionId);

                        if (sessionExists) {
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
                    ${renderToolStepsHtml(steps)}
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
            try {
                const sessionExists = await checkSessionExists(this.sessionId);
                if (!sessionExists) {
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
                this.processAssistantResponse(postResponse.content);

                // If there are sources, show them
                if (postResponse.sources && postResponse.sources.length > 0) {
                    this.showSources(postResponse.sources);
                }

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
        if (!this.sessionId) {
            throw new Error("No session ID available");
        }

        return setupStreamingResponse(
            this.sessionId,
            messageParams,
            // Content update handler
            (content: string) => {
                this.updateStreamingUI(content);
            },
            // Thinking update handler
            (thinking: string) => {
                this.showThinkingState(thinking);
            },
            // Tool execution handler
            (toolData: any) => {
                this.showToolExecutionInfo(toolData);
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
        const toolSteps = extractToolExecutionSteps(assistantResponse);
        const finalResponseText = extractFinalResponse(assistantResponse);

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
                        ${renderToolStepsHtml(toolSteps)}
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
                    const formattedResponse = formatMarkdown(finalResponseText);

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
                // Create a new message in the chat
                this.addMessageToChat('assistant', finalResponseText);
                console.log(`[${logId}] Successfully added new assistant message`);
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
     * Show tool execution information in the UI
     */
    private showToolExecutionInfo(toolExecutionData: any) {
        console.log(`Showing tool execution info: ${JSON.stringify(toolExecutionData)}`);

        // We'll update the in-chat tool execution area in the updateStreamingUI method
        // This method is now just a hook for the WebSocket handlers

        // Make sure the loading indicator is shown during tool execution
        this.loadingIndicator.style.display = 'flex';
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
