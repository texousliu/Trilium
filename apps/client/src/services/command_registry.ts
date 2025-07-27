import appContext, { type CommandNames } from "../components/app_context.js";

export interface CommandDefinition {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    shortcut?: string;
    commandName?: CommandNames;
    handler?: () => void | Promise<void>;
    aliases?: string[];
}

class CommandRegistry {
    private commands: Map<string, CommandDefinition> = new Map();
    private aliases: Map<string, string> = new Map();

    constructor() {
        this.registerDefaultCommands();
    }

    private registerDefaultCommands() {
        // Navigation & UI Commands
        this.register({
            id: "toggle-zen-mode",
            name: "Toggle Zen Mode",
            description: "Enter/exit distraction-free mode",
            icon: "bx bx-fullscreen",
            shortcut: "F9",
            commandName: "toggleZenMode"
        });

        this.register({
            id: "toggle-left-pane",
            name: "Toggle Left Pane",
            description: "Show/hide the note tree sidebar",
            icon: "bx bx-sidebar",
            handler: () => appContext.triggerCommand("toggleLeftPane")
        });

        this.register({
            id: "show-options",
            name: "Show Options",
            description: "Open settings/preferences",
            icon: "bx bx-cog",
            commandName: "showOptions",
            aliases: ["settings", "preferences"]
        });

        this.register({
            id: "show-help",
            name: "Show Help",
            description: "Open help documentation",
            icon: "bx bx-help-circle",
            handler: () => appContext.triggerCommand("showHelp")
        });

        this.register({
            id: "collapse-tree",
            name: "Collapse Tree",
            description: "Collapse all tree nodes",
            icon: "bx bx-collapse",
            shortcut: "Alt+C",
            handler: () => appContext.triggerCommand("collapseTree")
        });

        // Note Operations
        this.register({
            id: "create-note-into",
            name: "Create New Note",
            description: "Create a new child note",
            icon: "bx bx-plus",
            shortcut: "CommandOrControl+P",
            commandName: "createNoteInto",
            aliases: ["new note", "add note"]
        });

        this.register({
            id: "create-sql-console",
            name: "Create SQL Console",
            description: "Create a new SQL console note",
            icon: "bx bx-data",
            handler: () => appContext.triggerCommand("showSQLConsole")
        });

        this.register({
            id: "create-ai-chat",
            name: "Create AI Chat",
            description: "Create a new AI chat note",
            icon: "bx bx-bot",
            commandName: "createAiChat"
        });

        this.register({
            id: "clone-notes-to",
            name: "Clone Note",
            description: "Clone current note to another location",
            icon: "bx bx-copy",
            shortcut: "CommandOrControl+Shift+C",
            commandName: "cloneNotesTo"
        });

        this.register({
            id: "delete-notes",
            name: "Delete Note",
            description: "Delete current note",
            icon: "bx bx-trash",
            shortcut: "Delete",
            commandName: "deleteNotes"
        });

        this.register({
            id: "export-note",
            name: "Export Note",
            description: "Export current note",
            icon: "bx bx-export",
            handler: () => {
                const notePath = appContext.tabManager.getActiveContextNotePath();
                if (notePath) {
                    appContext.triggerCommand("showExportDialog", { 
                        notePath, 
                        defaultType: "single" 
                    });
                }
            }
        });

        this.register({
            id: "show-note-source",
            name: "Show Note Source",
            description: "View note in source mode",
            icon: "bx bx-code",
            handler: () => appContext.triggerCommand("showNoteSource")
        });

        this.register({
            id: "show-attachments",
            name: "Show Attachments",
            description: "View note attachments",
            icon: "bx bx-paperclip",
            handler: () => appContext.triggerCommand("showAttachments")
        });

        // Session & Security
        this.register({
            id: "enter-protected-session",
            name: "Enter Protected Session",
            description: "Enter password-protected mode",
            icon: "bx bx-lock",
            commandName: "enterProtectedSession"
        });

        this.register({
            id: "leave-protected-session",
            name: "Leave Protected Session",
            description: "Exit protected mode",
            icon: "bx bx-lock-open",
            commandName: "leaveProtectedSession"
        });

        // Search & Organization
        this.register({
            id: "search-notes",
            name: "Search Notes",
            description: "Open advanced search",
            icon: "bx bx-search",
            shortcut: "CommandOrControl+Shift+F",
            handler: () => appContext.triggerCommand("searchNotes", {})
        });

        this.register({
            id: "search-in-subtree",
            name: "Search in Subtree",
            description: "Search within current subtree",
            icon: "bx bx-search-alt",
            shortcut: "CommandOrControl+Shift+S",
            handler: () => {
                const notePath = appContext.tabManager.getActiveContextNotePath();
                if (notePath) {
                    appContext.triggerCommand("searchInSubtree", { notePath });
                }
            }
        });

        this.register({
            id: "show-search-history",
            name: "Show Search History",
            description: "View previous searches",
            icon: "bx bx-history",
            handler: () => appContext.triggerCommand("showSearchHistory")
        });

        this.register({
            id: "sort-child-notes",
            name: "Sort Child Notes",
            description: "Sort notes alphabetically",
            icon: "bx bx-sort",
            shortcut: "Alt+S",
            commandName: "sortChildNotes"
        });

        // Developer Tools
        this.register({
            id: "show-backend-log",
            name: "Show Backend Log",
            description: "View server logs",
            icon: "bx bx-terminal",
            handler: () => appContext.triggerCommand("showBackendLog")
        });

        this.register({
            id: "run-active-note",
            name: "Run Active Note",
            description: "Execute current note as script",
            icon: "bx bx-play",
            commandName: "runActiveNote"
        });

        // Recent Changes
        this.register({
            id: "show-recent-changes",
            name: "Show Recent Changes",
            description: "View recently modified notes",
            icon: "bx bx-time",
            handler: () => appContext.triggerCommand("showRecentChanges", { ancestorNoteId: "root" })
        });

        // Additional useful commands
        this.register({
            id: "open-new-tab",
            name: "Open New Tab",
            description: "Open a new tab",
            icon: "bx bx-tab",
            shortcut: "CommandOrControl+T",
            commandName: "openNewTab"
        });

        this.register({
            id: "close-active-tab",
            name: "Close Active Tab",
            description: "Close the current tab",
            icon: "bx bx-x",
            shortcut: "CommandOrControl+W",
            commandName: "closeActiveTab"
        });

        this.register({
            id: "show-launch-bar",
            name: "Show Launch Bar",
            description: "Open the launch bar subtree",
            icon: "bx bx-grid-alt",
            handler: () => appContext.triggerCommand("showLaunchBarSubtree")
        });
    }

    register(command: CommandDefinition) {
        this.commands.set(command.id, command);
        
        // Register aliases
        if (command.aliases) {
            for (const alias of command.aliases) {
                this.aliases.set(alias.toLowerCase(), command.id);
            }
        }
    }

    getCommand(id: string): CommandDefinition | undefined {
        return this.commands.get(id);
    }

    getAllCommands(): CommandDefinition[] {
        return Array.from(this.commands.values());
    }

    searchCommands(query: string): CommandDefinition[] {
        const normalizedQuery = query.toLowerCase();
        const results: { command: CommandDefinition; score: number }[] = [];

        for (const command of this.commands.values()) {
            let score = 0;

            // Exact match on name
            if (command.name.toLowerCase() === normalizedQuery) {
                score = 100;
            }
            // Name starts with query
            else if (command.name.toLowerCase().startsWith(normalizedQuery)) {
                score = 80;
            }
            // Name contains query
            else if (command.name.toLowerCase().includes(normalizedQuery)) {
                score = 60;
            }
            // Description contains query
            else if (command.description?.toLowerCase().includes(normalizedQuery)) {
                score = 40;
            }
            // Check aliases
            else if (command.aliases?.some(alias => alias.toLowerCase().includes(normalizedQuery))) {
                score = 50;
            }

            if (score > 0) {
                results.push({ command, score });
            }
        }

        // Sort by score (highest first) and then by name
        results.sort((a, b) => {
            if (a.score !== b.score) {
                return b.score - a.score;
            }
            return a.command.name.localeCompare(b.command.name);
        });

        return results.map(r => r.command);
    }

    async executeCommand(commandId: string) {
        const command = this.getCommand(commandId);
        if (!command) {
            console.error(`Command not found: ${commandId}`);
            return;
        }

        if (command.handler) {
            await command.handler();
        } else if (command.commandName) {
            appContext.triggerCommand(command.commandName);
        } else {
            console.error(`Command ${commandId} has no handler or commandName`);
        }
    }
}

const commandRegistry = new CommandRegistry();
export default commandRegistry;