import TypeWidget from "./type_widget.js";
import LlmChatPanel from "../llm_chat_panel.js";
import { type EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import server from "../../services/server.js";
import toastService from "../../services/toast.js";

export default class AiChatTypeWidget extends TypeWidget {
    private llmChatPanel: LlmChatPanel;
    private isInitialized: boolean = false;
    private initPromise: Promise<void> | null = null;

    async doRefresh(note: FNote | null | undefined) {
        try {
            console.log("doRefresh called for note:", note?.noteId);

            // If we're already initializing, wait for that to complete
            if (this.initPromise) {
                await this.initPromise;
                return;
            }

            // Initialize once or when note changes
            if (!this.isInitialized) {
                console.log("Initializing AI Chat Panel for note:", note?.noteId);

                // Initialize the note content first
                if (note) {
                    try {
                        const content = await note.getContent();
                        // Check if content is empty
                        if (!content || content === '{}') {
                            // Initialize with empty chat history
                            await this.saveData({
                                messages: [],
                                title: note.title,
                                noteId: note.noteId // Store the note ID in the data
                            });
                            console.log("Initialized empty chat history for new note");
                        } else {
                            console.log("Note already has content, will load in LlmChatPanel.refresh()");
                        }
                    } catch (e) {
                        console.error("Error initializing AI Chat note content:", e);
                    }
                }

                // Create a promise to track initialization
                this.initPromise = (async () => {
                    try {
                        // Reset the UI before refreshing
                        this.llmChatPanel.clearNoteContextChatMessages();
                        this.llmChatPanel.setMessages([]);

                        // Set the note ID for the chat panel
                        if (note) {
                            this.llmChatPanel.setNoteId(note.noteId);
                        }

                        // This will load saved data via the getData callback
                        await this.llmChatPanel.refresh();
                        this.isInitialized = true;
                    } catch (e) {
                        console.error("Error initializing LlmChatPanel:", e);
                        toastService.showError("Failed to initialize chat panel. Try reloading.");
                    }
                })();

                await this.initPromise;
                this.initPromise = null;
            }
        } catch (e) {
            console.error("Error in doRefresh:", e);
            toastService.showError("Error refreshing chat. Please try again.");
        }
    }

    async entitiesReloadedEvent(data: EventData<"entitiesReloaded">) {
        // We don't need to refresh on entities reloaded for the chat
    }

    async noteSwitched() {
        console.log("Note switched to:", this.noteId);

        // Force a full reset when switching notes
        this.isInitialized = false;
        this.initPromise = null;

        if (this.note) {
            // Update the chat panel with the new note ID before refreshing
            this.llmChatPanel.setCurrentNoteId(this.note.noteId);

            // Reset the chat panel UI
            this.llmChatPanel.clearNoteContextChatMessages();
            this.llmChatPanel.setMessages([]);
            this.llmChatPanel.setNoteId(this.note.noteId);
        }

        // Call the parent method to refresh
        await super.noteSwitched();
    }

    async activeContextChangedEvent(data: EventData<"activeContextChanged">) {
        if (!this.isActive()) {
            return;
        }

        console.log("Active context changed, refreshing AI Chat Panel");

        // Always refresh when we become active - this ensures we load the correct note data
        try {
            // Reset initialization flag to force a refresh
            this.isInitialized = false;

            // Make sure the chat panel has the current note ID
            if (this.note) {
                this.llmChatPanel.setCurrentNoteId(this.note.noteId);
                this.llmChatPanel.setNoteId(this.note.noteId);
            }

            this.initPromise = (async () => {
                try {
                    // Reset the UI before refreshing
                    this.llmChatPanel.clearNoteContextChatMessages();
                    this.llmChatPanel.setMessages([]);

                    await this.llmChatPanel.refresh();
                    this.isInitialized = true;
                } catch (e) {
                    console.error("Error refreshing LlmChatPanel:", e);
                }
            })();

            await this.initPromise;
            this.initPromise = null;
        } catch (e) {
            console.error("Error in activeContextChangedEvent:", e);
        }
    }

    // Save chat data to the note
    async saveData(data: any) {
        // If we have a noteId in the data, that's the AI Chat note we should save to
        // This happens when the chat panel is saving its conversation
        const targetNoteId = data.noteId;

        // If no noteId in data, use the current note (for new chats)
        const noteIdToUse = targetNoteId || this.note?.noteId;

        if (!noteIdToUse) {
            console.warn("Cannot save AI Chat data: no note ID available");
            return;
        }

        try {
            console.log(`AiChatTypeWidget: Saving data for note ${noteIdToUse} (current note: ${this.note?.noteId}, data.noteId: ${data.noteId})`);

            // Safety check: if we have both IDs and they don't match, warn about it
            if (targetNoteId && this.note?.noteId && targetNoteId !== this.note.noteId) {
                console.warn(`Note ID mismatch: saving to ${targetNoteId} but current note is ${this.note.noteId}`);
            }

            // Format the data properly - this is the canonical format of the data
            const formattedData = {
                messages: data.messages || [],
                noteId: noteIdToUse, // Always preserve the correct note ID
                toolSteps: data.toolSteps || [],
                sources: data.sources || [],
                metadata: {
                    ...(data.metadata || {}),
                    lastUpdated: new Date().toISOString()
                }
            };

            // Save the data to the correct note
            await server.put(`notes/${noteIdToUse}/data`, {
                content: JSON.stringify(formattedData, null, 2)
            });
        } catch (e) {
            console.error("Error saving AI Chat data:", e);
            toastService.showError("Failed to save chat data");
        }
    }
}
