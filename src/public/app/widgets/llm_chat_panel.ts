import BasicWidget from "./basic_widget.js";
import toastService from "../services/toast.js";
import server from "../services/server.js";
import appContext from "../components/app_context.js";
import utils from "../services/utils.js";
import { t } from "../services/i18n.js";

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
    private sessionId: string | null = null;
    private currentNoteId: string | null = null;

    doRender() {
        this.$widget = $(`
            <div class="note-context-chat h-100 w-100 d-flex flex-column">
                <div class="note-context-chat-container flex-grow-1 overflow-auto p-3">
                    <div class="note-context-chat-messages"></div>
                    <div class="loading-indicator" style="display: none;">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="ms-2">${t('common.processing')}...</span>
                    </div>
                </div>

                <div class="sources-container p-2 border-top" style="display: none;">
                    <h6 class="m-0 p-1">${t('ai.sources')}</h6>
                    <div class="sources-list"></div>
                </div>

                <form class="note-context-chat-form d-flex flex-column border-top p-2">
                    <div class="d-flex mb-2 align-items-center">
                        <div class="form-check form-switch">
                            <input class="form-check-input use-advanced-context-checkbox" type="checkbox" id="useAdvancedContext" checked>
                            <label class="form-check-label" for="useAdvancedContext">
                                ${t('ai.use_advanced_context')}
                            </label>
                        </div>
                        <div class="ms-2 small text-muted">
                            <i class="bx bx-info-circle"></i>
                            <span>${t('ai.advanced_context_helps')}</span>
                        </div>
                    </div>
                    <div class="d-flex">
                        <textarea
                            class="form-control note-context-chat-input"
                            placeholder="${t('ai.enter_message')}"
                            rows="3"
                        ></textarea>
                        <button type="submit" class="btn btn-primary note-context-chat-send-button ms-2">
                            <i class="bx bx-send"></i>
                        </button>
                    </div>
                </form>
            </div>
        `);

        const element = this.$widget[0];
        this.noteContextChatMessages = element.querySelector('.note-context-chat-messages') as HTMLElement;
        this.noteContextChatForm = element.querySelector('.note-context-chat-form') as HTMLFormElement;
        this.noteContextChatInput = element.querySelector('.note-context-chat-input') as HTMLTextAreaElement;
        this.noteContextChatSendButton = element.querySelector('.note-context-chat-send-button') as HTMLButtonElement;
        this.chatContainer = element.querySelector('.note-context-chat-container') as HTMLElement;
        this.loadingIndicator = element.querySelector('.loading-indicator') as HTMLElement;
        this.sourcesList = element.querySelector('.sources-list') as HTMLElement;
        this.useAdvancedContextCheckbox = element.querySelector('.use-advanced-context-checkbox') as HTMLInputElement;

        this.initializeEventListeners();

        // Create a session when first loaded
        this.createChatSession();

        return this.$widget;
    }

    async refresh() {
        if (!this.isVisible()) {
            return;
        }

        // Get current note context if needed
        this.currentNoteId = appContext.tabManager.getActiveContext()?.note?.noteId || null;

        if (!this.sessionId) {
            // Create a new chat session
            await this.createChatSession();
        }
    }

    private async createChatSession() {
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

    private async sendMessage(content: string) {
        if (!content.trim() || !this.sessionId) {
            return;
        }

        this.addMessageToChat('user', content);
        this.noteContextChatInput.value = '';
        this.showLoadingIndicator();
        this.hideSources();

        try {
            const useAdvancedContext = this.useAdvancedContextCheckbox.checked;

            // Setup streaming
            const source = new EventSource(`./api/llm/messages?sessionId=${this.sessionId}&format=stream`);
            let assistantResponse = '';

            // Handle streaming response
            source.onmessage = (event) => {
                if (event.data === '[DONE]') {
                    // Stream completed
                    source.close();
                    this.hideLoadingIndicator();
                    return;
                }

                try {
                    const data = JSON.parse(event.data);
                    if (data.content) {
                        assistantResponse += data.content;
                        // Update the UI with the accumulated response
                        const assistantElement = this.noteContextChatMessages.querySelector('.assistant-message:last-child .message-content');
                        if (assistantElement) {
                            assistantElement.innerHTML = this.formatMarkdown(assistantResponse);
                        } else {
                            this.addMessageToChat('assistant', assistantResponse);
                        }
                        // Scroll to the bottom
                        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
                    }
                } catch (e) {
                    console.error('Error parsing SSE message:', e);
                }
            };

            source.onerror = () => {
                source.close();
                this.hideLoadingIndicator();
                toastService.showError('Error connecting to the LLM service. Please try again.');
            };

            // Send the actual message
            const response = await server.post<any>('llm/messages', {
                sessionId: this.sessionId,
                content,
                contextNoteId: this.currentNoteId,
                useAdvancedContext
            });

            // Handle sources if returned in non-streaming response
            if (response && response.sources && response.sources.length > 0) {
                this.showSources(response.sources);
            }
        } catch (error) {
            this.hideLoadingIndicator();
            toastService.showError('Error sending message: ' + (error as Error).message);
        }
    }

    private addMessageToChat(role: 'user' | 'assistant', content: string) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role}-message mb-3`;

        const avatarElement = document.createElement('div');
        avatarElement.className = 'message-avatar';
        avatarElement.innerHTML = role === 'user'
            ? '<i class="bx bx-user"></i>'
            : '<i class="bx bx-bot"></i>';

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content p-3';

        // Use a simple markdown formatter if utils.formatMarkdown is not available
        let formattedContent = content
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        contentElement.innerHTML = formattedContent;

        messageElement.appendChild(avatarElement);
        messageElement.appendChild(contentElement);

        this.noteContextChatMessages.appendChild(messageElement);

        // Scroll to bottom
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    private showSources(sources: Array<{noteId: string, title: string}>) {
        this.sourcesList.innerHTML = '';

        sources.forEach(source => {
            const sourceElement = document.createElement('div');
            sourceElement.className = 'source-item p-1';
            sourceElement.innerHTML = `<a href="#" data-note-id="${source.noteId}" class="source-link">${source.title}</a>`;

            sourceElement.querySelector('.source-link')?.addEventListener('click', (e) => {
                e.preventDefault();
                appContext.tabManager.openTabWithNoteWithHoisting(source.noteId);
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
        this.loadingIndicator.style.display = 'flex';
    }

    private hideLoadingIndicator() {
        this.loadingIndicator.style.display = 'none';
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
        // Simple markdown formatting - could be replaced with a proper markdown library
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    }
}
