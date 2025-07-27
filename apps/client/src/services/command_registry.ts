import appContext, { type CommandNames } from "../components/app_context.js";
import keyboardActions from "./keyboard_actions.js";

export interface CommandDefinition {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    shortcut?: string;
    commandName?: CommandNames;
    handler?: () => void | Promise<void>;
    aliases?: string[];
    source?: "manual" | "keyboard-action";
}

class CommandRegistry {
    private commands: Map<string, CommandDefinition> = new Map();
    private aliases: Map<string, string> = new Map();

    constructor() {
        this.registerDefaultCommands();
        this.loadKeyboardActionsAsync();
    }

    private registerDefaultCommands() {
        // Keep only commands with custom handlers or better descriptions
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

        // Special commands with custom handlers
        this.register({
            id: "create-sql-console",
            name: "Create SQL Console",
            description: "Create a new SQL console note",
            icon: "bx bx-data",
            handler: () => appContext.triggerCommand("showSQLConsole")
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

        // Special search commands with custom logic
        this.register({
            id: "search-notes",
            name: "Search Notes",
            description: "Open advanced search",
            icon: "bx bx-search",
            handler: () => appContext.triggerCommand("searchNotes", {})
        });

        this.register({
            id: "search-in-subtree",
            name: "Search in Subtree",
            description: "Search within current subtree",
            icon: "bx bx-search-alt",
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
            id: "show-backend-log",
            name: "Show Backend Log",
            description: "View server logs",
            icon: "bx bx-terminal",
            handler: () => appContext.triggerCommand("showBackendLog")
        });

        this.register({
            id: "show-recent-changes",
            name: "Show Recent Changes",
            description: "View recently modified notes",
            icon: "bx bx-time",
            handler: () => appContext.triggerCommand("showRecentChanges", { ancestorNoteId: "root" })
        });

        this.register({
            id: "show-launch-bar",
            name: "Show Launch Bar",
            description: "Open the launch bar subtree",
            icon: "bx bx-grid-alt",
            handler: () => appContext.triggerCommand("showLaunchBarSubtree")
        });
    }

    private async loadKeyboardActionsAsync() {
        try {
            const actions = await keyboardActions.getActions();
            this.registerKeyboardActions(actions);
        } catch (error) {
            console.error("Failed to load keyboard actions:", error);
        }
    }

    private registerKeyboardActions(actions: any[]) {
        for (const action of actions) {
            // Skip actions that we've already manually registered
            if (this.commands.has(action.actionName)) {
                continue;
            }

            // Skip actions that don't have a description (likely separators)
            if (!action.description) {
                continue;
            }

            // Get the primary shortcut (first one in the list)
            const primaryShortcut = action.effectiveShortcuts?.[0];
            
            // Create a command definition from the keyboard action
            const commandDef: CommandDefinition = {
                id: action.actionName,
                name: this.formatActionName(action.actionName),
                description: action.description,
                icon: this.getIconForAction(action.actionName),
                shortcut: primaryShortcut ? this.formatShortcut(primaryShortcut) : undefined,
                commandName: action.actionName as CommandNames,
                source: "keyboard-action"
            };

            this.register(commandDef);
        }
    }

    private formatActionName(actionName: string): string {
        // Convert camelCase to Title Case
        return actionName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    private formatShortcut(shortcut: string): string {
        // Convert electron accelerator format to display format
        return shortcut
            .replace(/CommandOrControl/g, 'Ctrl')
            .replace(/\+/g, ' + ');
    }

    private getIconForAction(actionName: string): string {
        // Map common action patterns to icons
        const iconMap: Record<string, string> = {
            // Navigation
            'jumpToNote': 'bx bx-search',
            'commandPalette': 'bx bx-command',
            'scrollToActiveNote': 'bx bx-target-lock',
            'backInNoteHistory': 'bx bx-arrow-back',
            'forwardInNoteHistory': 'bx bx-arrow-forward',
            
            // Tree operations
            'collapseTree': 'bx bx-collapse',
            'collapseSubtree': 'bx bx-minus-circle',
            'expandSubtree': 'bx bx-plus-circle',
            'sortChildNotes': 'bx bx-sort',
            
            // Note operations
            'createNoteAfter': 'bx bx-plus',
            'createNoteInto': 'bx bx-plus-circle',
            'createNoteIntoInbox': 'bx bx-inbox',
            'deleteNotes': 'bx bx-trash',
            'editNoteTitle': 'bx bx-edit',
            'duplicateSubtree': 'bx bx-copy',
            
            // Movement
            'moveNoteUp': 'bx bx-up-arrow',
            'moveNoteDown': 'bx bx-down-arrow',
            'moveNoteUpInHierarchy': 'bx bx-left-arrow',
            'moveNoteDownInHierarchy': 'bx bx-right-arrow',
            
            // Clipboard
            'copyNotesToClipboard': 'bx bx-copy',
            'cutNotesToClipboard': 'bx bx-cut',
            'pasteNotesFromClipboard': 'bx bx-paste',
            
            // Tabs
            'openNewTab': 'bx bx-tab',
            'closeActiveTab': 'bx bx-x',
            'activateNextTab': 'bx bx-chevron-right',
            'activatePreviousTab': 'bx bx-chevron-left',
            'reopenLastTab': 'bx bx-refresh',
            
            // Windows
            'openNewWindow': 'bx bx-window-open',
            'toggleTray': 'bx bx-hide',
            'toggleZenMode': 'bx bx-fullscreen',
            
            // Search
            'quickSearch': 'bx bx-search-alt',
            'searchInSubtree': 'bx bx-search-alt-2',
            
            // Other
            'runActiveNote': 'bx bx-play',
            'showOptions': 'bx bx-cog'
        };

        return iconMap[actionName] || 'bx bx-command';
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