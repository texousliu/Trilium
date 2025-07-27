"use strict";

import optionService from "./options.js";
import log from "./log.js";
import { isElectron, isMac } from "./utils.js";
import type { ActionKeyboardShortcut, KeyboardShortcut } from "@triliumnext/commons";
import { t } from "i18next";

function getDefaultKeyboardActions() {
    if (!t("keyboard_actions.note-navigation")) {
        throw new Error("Keyboard actions loaded before translations.");
    }

    const DEFAULT_KEYBOARD_ACTIONS: KeyboardShortcut[] = [
        {
            separator: t("keyboard_actions.note-navigation")
        },
        {
            actionName: "backInNoteHistory",
            friendlyName: "Back in Note History",
            // Mac has a different history navigation shortcuts - https://github.com/zadam/trilium/issues/376
            defaultShortcuts: isMac ? ["CommandOrControl+Left"] : ["Alt+Left"],
            description: t("keyboard_actions.back-in-note-history"),
            scope: "window"
        },
        {
            actionName: "forwardInNoteHistory",
            friendlyName: "Forward in Note History",
            // Mac has a different history navigation shortcuts - https://github.com/zadam/trilium/issues/376
            defaultShortcuts: isMac ? ["CommandOrControl+Right"] : ["Alt+Right"],
            description: t("keyboard_actions.forward-in-note-history"),
            scope: "window"
        },
        {
            actionName: "jumpToNote",
            friendlyName: "Jump to Note",
            defaultShortcuts: ["CommandOrControl+J"],
            description: t("keyboard_actions.open-jump-to-note-dialog"),
            scope: "window"
        },
        {
            actionName: "commandPalette",
            friendlyName: "Command Palette",
            defaultShortcuts: ["CommandOrControl+Shift+J"],
            description: t("keyboard_actions.open-command-palette"),
            scope: "window"
        },
        {
            actionName: "scrollToActiveNote",
            friendlyName: "Scroll to Active Note",
            defaultShortcuts: ["CommandOrControl+."],
            description: t("keyboard_actions.scroll-to-active-note"),
            scope: "window"
        },
        {
            actionName: "quickSearch",
            friendlyName: "Quick Search",
            defaultShortcuts: ["CommandOrControl+S"],
            description: t("keyboard_actions.quick-search"),
            scope: "window"
        },
        {
            actionName: "searchInSubtree",
            friendlyName: "Search in Subtree",
            defaultShortcuts: ["CommandOrControl+Shift+S"],
            description: t("keyboard_actions.search-in-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "expandSubtree",
            friendlyName: "Expand Subtree",
            defaultShortcuts: [],
            description: t("keyboard_actions.expand-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "collapseTree",
            friendlyName: "Collapse Tree",
            defaultShortcuts: ["Alt+C"],
            description: t("keyboard_actions.collapse-tree"),
            scope: "window"
        },
        {
            actionName: "collapseSubtree",
            friendlyName: "Collapse Subtree",
            defaultShortcuts: ["Alt+-"],
            description: t("keyboard_actions.collapse-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "sortChildNotes",
            friendlyName: "Sort Child Notes",
            defaultShortcuts: ["Alt+S"],
            description: t("keyboard_actions.sort-child-notes"),
            scope: "note-tree"
        },

        {
            separator: t("keyboard_actions.creating-and-moving-notes")
        },
        {
            actionName: "createNoteAfter",
            friendlyName: "Create Note After",
            defaultShortcuts: ["CommandOrControl+O"],
            description: t("keyboard_actions.create-note-after"),
            scope: "window"
        },
        {
            actionName: "createNoteInto",
            friendlyName: "Create Note Into",
            defaultShortcuts: ["CommandOrControl+P"],
            description: t("keyboard_actions.create-note-into"),
            scope: "window"
        },
        {
            actionName: "createNoteIntoInbox",
            friendlyName: "Create Note Into Inbox",
            defaultShortcuts: ["global:CommandOrControl+Alt+P"],
            description: t("keyboard_actions.create-note-into-inbox"),
            scope: "window"
        },
        {
            actionName: "deleteNotes",
            friendlyName: "Delete Notes",
            defaultShortcuts: ["Delete"],
            description: t("keyboard_actions.delete-note"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteUp",
            friendlyName: "Move Note Up",
            defaultShortcuts: isMac ? ["Alt+Up"] : ["CommandOrControl+Up"],
            description: t("keyboard_actions.move-note-up"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteDown",
            friendlyName: "Move Note Down",
            defaultShortcuts: isMac ? ["Alt+Down"] : ["CommandOrControl+Down"],
            description: t("keyboard_actions.move-note-down"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteUpInHierarchy",
            friendlyName: "Move Note Up in Hierarchy",
            defaultShortcuts: isMac ? ["Alt+Left"] : ["CommandOrControl+Left"],
            description: t("keyboard_actions.move-note-up-in-hierarchy"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteDownInHierarchy",
            friendlyName: "Move Note Down in Hierarchy",
            defaultShortcuts: isMac ? ["Alt+Right"] : ["CommandOrControl+Right"],
            description: t("keyboard_actions.move-note-down-in-hierarchy"),
            scope: "note-tree"
        },
        {
            actionName: "editNoteTitle",
            friendlyName: "Edit Note Title",
            defaultShortcuts: ["Enter"],
            description: t("keyboard_actions.edit-note-title"),
            scope: "note-tree"
        },
        {
            actionName: "editBranchPrefix",
            friendlyName: "Edit Branch Prefix",
            defaultShortcuts: ["F2"],
            description: t("keyboard_actions.edit-branch-prefix"),
            scope: "note-tree"
        },
        {
            actionName: "cloneNotesTo",
            friendlyName: "Clone Notes To",
            defaultShortcuts: ["CommandOrControl+Shift+C"],
            description: t("keyboard_actions.clone-notes-to"),
            scope: "window"
        },
        {
            actionName: "moveNotesTo",
            friendlyName: "Move Notes To",
            defaultShortcuts: ["CommandOrControl+Shift+X"],
            description: t("keyboard_actions.move-notes-to"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.note-clipboard")
        },

        {
            actionName: "copyNotesToClipboard",
            friendlyName: "Copy Notes to Clipboard",
            defaultShortcuts: ["CommandOrControl+C"],
            description: t("keyboard_actions.copy-notes-to-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "pasteNotesFromClipboard",
            friendlyName: "Paste Notes from Clipboard",
            defaultShortcuts: ["CommandOrControl+V"],
            description: t("keyboard_actions.paste-notes-from-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "cutNotesToClipboard",
            friendlyName: "Cut Notes to Clipboard",
            defaultShortcuts: ["CommandOrControl+X"],
            description: t("keyboard_actions.cut-notes-to-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "selectAllNotesInParent",
            friendlyName: "Select All Notes in Parent",
            defaultShortcuts: ["CommandOrControl+A"],
            description: t("keyboard_actions.select-all-notes-in-parent"),
            scope: "note-tree"
        },
        {
            actionName: "addNoteAboveToSelection",
            friendlyName: "Add Note Above to Selection",
            defaultShortcuts: ["Shift+Up"],
            description: t("keyboard_actions.add-note-above-to-the-selection"),
            scope: "note-tree"
        },
        {
            actionName: "addNoteBelowToSelection",
            friendlyName: "Add Note Below to Selection",
            defaultShortcuts: ["Shift+Down"],
            description: t("keyboard_actions.add-note-below-to-selection"),
            scope: "note-tree"
        },
        {
            actionName: "duplicateSubtree",
            friendlyName: "Duplicate Subtree",
            defaultShortcuts: [],
            description: t("keyboard_actions.duplicate-subtree"),
            scope: "note-tree"
        },

        {
            separator: t("keyboard_actions.tabs-and-windows")
        },
        {
            actionName: "openNewTab",
            friendlyName: "Open New Tab",
            defaultShortcuts: isElectron ? ["CommandOrControl+T"] : [],
            description: t("keyboard_actions.open-new-tab"),
            scope: "window"
        },
        {
            actionName: "closeActiveTab",
            friendlyName: "Close Active Tab",
            defaultShortcuts: isElectron ? ["CommandOrControl+W"] : [],
            description: t("keyboard_actions.close-active-tab"),
            scope: "window"
        },
        {
            actionName: "reopenLastTab",
            friendlyName: "Reopen Last Tab",
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+T"] : [],
            description: t("keyboard_actions.reopen-last-tab"),
            scope: "window"
        },
        {
            actionName: "activateNextTab",
            friendlyName: "Activate Next Tab",
            defaultShortcuts: isElectron ? ["CommandOrControl+Tab", "CommandOrControl+PageDown"] : [],
            description: t("keyboard_actions.activate-next-tab"),
            scope: "window"
        },
        {
            actionName: "activatePreviousTab",
            friendlyName: "Activate Previous Tab",
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+Tab", "CommandOrControl+PageUp"] : [],
            description: t("keyboard_actions.activate-previous-tab"),
            scope: "window"
        },
        {
            actionName: "openNewWindow",
            friendlyName: "Open New Window",
            defaultShortcuts: [],
            description: t("keyboard_actions.open-new-window"),
            scope: "window"
        },
        {
            actionName: "toggleTray",
            friendlyName: "Toggle System Tray Icon",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-tray"),
            scope: "window"
        },
        {
            actionName: "toggleZenMode",
            friendlyName: "Toggle Zen Mode",
            defaultShortcuts: ["F9"],
            description: t("keyboard_actions.toggle-zen-mode"),
            scope: "window"
        },
        {
            actionName: "firstTab",
            friendlyName: "Switch to First Tab",
            defaultShortcuts: ["CommandOrControl+1"],
            description: t("keyboard_actions.first-tab"),
            scope: "window"
        },
        {
            actionName: "secondTab",
            friendlyName: "Switch to Second Tab",
            defaultShortcuts: ["CommandOrControl+2"],
            description: t("keyboard_actions.second-tab"),
            scope: "window"
        },
        {
            actionName: "thirdTab",
            friendlyName: "Switch to Third Tab",
            defaultShortcuts: ["CommandOrControl+3"],
            description: t("keyboard_actions.third-tab"),
            scope: "window"
        },
        {
            actionName: "fourthTab",
            friendlyName: "Switch to Fourth Tab",
            defaultShortcuts: ["CommandOrControl+4"],
            description: t("keyboard_actions.fourth-tab"),
            scope: "window"
        },
        {
            actionName: "fifthTab",
            friendlyName: "Switch to Fifth Tab",
            defaultShortcuts: ["CommandOrControl+5"],
            description: t("keyboard_actions.fifth-tab"),
            scope: "window"
        },
        {
            actionName: "sixthTab",
            friendlyName: "Switch to Sixth Tab",
            defaultShortcuts: ["CommandOrControl+6"],
            description: t("keyboard_actions.sixth-tab"),
            scope: "window"
        },
        {
            actionName: "seventhTab",
            friendlyName: "Switch to Seventh Tab",
            defaultShortcuts: ["CommandOrControl+7"],
            description: t("keyboard_actions.seventh-tab"),
            scope: "window"
        },
        {
            actionName: "eigthTab",
            friendlyName: "Switch to Eighth Tab",
            defaultShortcuts: ["CommandOrControl+8"],
            description: t("keyboard_actions.eight-tab"),
            scope: "window"
        },
        {
            actionName: "ninthTab",
            friendlyName: "Switch to Ninth Tab",
            defaultShortcuts: ["CommandOrControl+9"],
            description: t("keyboard_actions.ninth-tab"),
            scope: "window"
        },
        {
            actionName: "lastTab",
            friendlyName: "Switch to Last Tab",
            defaultShortcuts: ["CommandOrControl+0"],
            description: t("keyboard_actions.last-tab"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.dialogs")
        },
        {
            friendlyName: "Show Note Source",
            actionName: "showNoteSource",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-note-source"),
            scope: "window"
        },
        {
            friendlyName: "Show Options",
            actionName: "showOptions",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-options"),
            scope: "window"
        },
        {
            friendlyName: "Show Revisions",
            actionName: "showRevisions",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-revisions"),
            scope: "window"
        },
        {
            friendlyName: "Show Recent Changes",
            actionName: "showRecentChanges",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-recent-changes"),
            scope: "window"
        },
        {
            friendlyName: "Show SQL Console",
            actionName: "showSQLConsole",
            defaultShortcuts: ["Alt+O"],
            description: t("keyboard_actions.show-sql-console"),
            scope: "window"
        },
        {
            friendlyName: "Show Backend Log",
            actionName: "showBackendLog",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-backend-log"),
            scope: "window"
        },
        {
            friendlyName: "Show Help",
            actionName: "showHelp",
            defaultShortcuts: ["F1"],
            description: t("keyboard_actions.show-help"),
            scope: "window"
        },
        {
            friendlyName: "Show Cheatsheet",
            actionName: "showCheatsheet",
            defaultShortcuts: ["Shift+F1"],
            description: t("keyboard_actions.show-cheatsheet"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.text-note-operations")
        },

        {
            friendlyName: "Add Link to Text",
            actionName: "addLinkToText",
            defaultShortcuts: ["CommandOrControl+L"],
            description: t("keyboard_actions.add-link-to-text"),
            scope: "text-detail"
        },
        {
            friendlyName: "Follow Link Under Cursor",
            actionName: "followLinkUnderCursor",
            defaultShortcuts: ["CommandOrControl+Enter"],
            description: t("keyboard_actions.follow-link-under-cursor"),
            scope: "text-detail"
        },
        {
            friendlyName: "Insert Date and Time to Text",
            actionName: "insertDateTimeToText",
            defaultShortcuts: ["Alt+T"],
            description: t("keyboard_actions.insert-date-and-time-to-text"),
            scope: "text-detail"
        },
        {
            friendlyName: "Paste Markdown into Text",
            actionName: "pasteMarkdownIntoText",
            defaultShortcuts: [],
            description: t("keyboard_actions.paste-markdown-into-text"),
            scope: "text-detail"
        },
        {
            friendlyName: "Cut into Note",
            actionName: "cutIntoNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.cut-into-note"),
            scope: "text-detail"
        },
        {
            friendlyName: "Add Include Note to Text",
            actionName: "addIncludeNoteToText",
            defaultShortcuts: [],
            description: t("keyboard_actions.add-include-note-to-text"),
            scope: "text-detail"
        },
        {
            friendlyName: "Edit Read-Only Note",
            actionName: "editReadOnlyNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.edit-readonly-note"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.attributes-labels-and-relations")
        },

        {
            friendlyName: "Add New Label",
            actionName: "addNewLabel",
            defaultShortcuts: ["Alt+L"],
            description: t("keyboard_actions.add-new-label"),
            scope: "window"
        },
        {
            friendlyName: "Add New Relation",
            actionName: "addNewRelation",
            defaultShortcuts: ["Alt+R"],
            description: t("keyboard_actions.create-new-relation"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.ribbon-tabs")
        },

        {
            friendlyName: "Toggle Ribbon Tab Classic Editor",
            actionName: "toggleRibbonTabClassicEditor",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-classic-editor-toolbar"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabBasicProperties",
            friendlyName: "Toggle Ribbon Tab Basic Properties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-basic-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabBookProperties",
            friendlyName: "Toggle Ribbon Tab Book Properties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-book-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabFileProperties",
            friendlyName: "Toggle Ribbon Tab File Properties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-file-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabImageProperties",
            friendlyName: "Toggle Ribbon Tab Image Properties",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-image-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabOwnedAttributes",
            friendlyName: "Toggle Ribbon Tab Owned Attributes",
            defaultShortcuts: ["Alt+A"],
            description: t("keyboard_actions.toggle-owned-attributes"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabInheritedAttributes",
            friendlyName: "Toggle Ribbon Tab Inherited Attributes",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-inherited-attributes"),
            scope: "window"
        },
        // TODO: Remove or change since promoted attributes have been changed.
        {
            actionName: "toggleRibbonTabPromotedAttributes",
            friendlyName: "Toggle Ribbon Tab Promoted Attributes",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-promoted-attributes"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNoteMap",
            friendlyName: "Toggle Ribbon Tab Note Map",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-link-map"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNoteInfo",
            friendlyName: "Toggle Ribbon Tab Note Info",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-note-info"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNotePaths",
            friendlyName: "Toggle Ribbon Tab Note Paths",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-note-paths"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabSimilarNotes",
            friendlyName: "Toggle Ribbon Tab Similar Notes",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-similar-notes"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.other")
        },

        {
            actionName: "toggleRightPane",
            friendlyName: "Toggle Right Pane",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-right-pane"),
            scope: "window"
        },
        {
            actionName: "printActiveNote",
            friendlyName: "Print Active Note",
            defaultShortcuts: [],
            description: t("keyboard_actions.print-active-note"),
            scope: "window"
        },
        {
            actionName: "exportAsPdf",
            friendlyName: "Export Active Note as PDF",
            defaultShortcuts: [],
            description: t("keyboard_actions.export-as-pdf"),
            scope: "window"
        },
        {
            actionName: "openNoteExternally",
            friendlyName: "Open Note Externally",
            defaultShortcuts: [],
            description: t("keyboard_actions.open-note-externally"),
            scope: "window"
        },
        {
            actionName: "renderActiveNote",
            friendlyName: "Render Active Note",
            defaultShortcuts: [],
            description: t("keyboard_actions.render-active-note"),
            scope: "window"
        },
        {
            actionName: "runActiveNote",
            friendlyName: "Run Active Note",
            defaultShortcuts: ["CommandOrControl+Enter"],
            description: t("keyboard_actions.run-active-note"),
            scope: "code-detail"
        },
        {
            actionName: "toggleNoteHoisting",
            friendlyName: "Toggle Note Hoisting",
            defaultShortcuts: ["Alt+H"],
            description: t("keyboard_actions.toggle-note-hoisting"),
            scope: "window"
        },
        {
            actionName: "unhoist",
            friendlyName: "Unhoist Note",
            defaultShortcuts: ["Alt+U"],
            description: t("keyboard_actions.unhoist"),
            scope: "window"
        },
        {
            actionName: "reloadFrontendApp",
            friendlyName: "Reload Frontend App",
            defaultShortcuts: ["F5", "CommandOrControl+R"],
            description: t("keyboard_actions.reload-frontend-app"),
            scope: "window"
        },
        {
            actionName: "openDevTools",
            friendlyName: "Open Developer Tools",
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+I"] : [],
            description: t("keyboard_actions.open-dev-tools"),
            scope: "window"
        },
        {
            actionName: "findInText",
            friendlyName: "Find In Text",
            defaultShortcuts: isElectron ? ["CommandOrControl+F"] : [],
            description: t("keyboard_actions.find-in-text"),
            scope: "window"
        },
        {
            actionName: "toggleLeftPane",
            friendlyName: "Toggle Left Pane",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-left-note-tree-panel"),
            scope: "window"
        },
        {
            actionName: "toggleFullscreen",
            friendlyName: "Toggle Full Screen",
            defaultShortcuts: ["F11"],
            description: t("keyboard_actions.toggle-full-screen"),
            scope: "window"
        },
        {
            actionName: "zoomOut",
            friendlyName: "Zoom Out",
            defaultShortcuts: isElectron ? ["CommandOrControl+-"] : [],
            description: t("keyboard_actions.zoom-out"),
            scope: "window"
        },
        {
            actionName: "zoomIn",
            friendlyName: "Zoom In",
            description: t("keyboard_actions.zoom-in"),
            defaultShortcuts: isElectron ? ["CommandOrControl+="] : [],
            scope: "window"
        },
        {
            actionName: "zoomReset",
            friendlyName: "Reset Zoom Level",
            description: t("keyboard_actions.reset-zoom-level"),
            defaultShortcuts: isElectron ? ["CommandOrControl+0"] : [],
            scope: "window"
        },
        {
            actionName: "copyWithoutFormatting",
            friendlyName: "Copy Without Formatting",
            defaultShortcuts: ["CommandOrControl+Alt+C"],
            description: t("keyboard_actions.copy-without-formatting"),
            scope: "text-detail"
        },
        {
            actionName: "forceSaveRevision",
            friendlyName: "Force Save Revision",
            defaultShortcuts: [],
            description: t("keyboard_actions.force-save-revision"),
            scope: "window"
        }
    ];

    /*
     * Apply macOS-specific tweaks.
     */
    const platformModifier = isMac ? "Meta" : "Ctrl";

    for (const action of DEFAULT_KEYBOARD_ACTIONS) {
        if ("defaultShortcuts" in action && action.defaultShortcuts) {
            action.defaultShortcuts = action.defaultShortcuts.map((shortcut) => shortcut.replace("CommandOrControl", platformModifier));
        }
    }

    return DEFAULT_KEYBOARD_ACTIONS;
}

function getKeyboardActions() {
    const actions: KeyboardShortcut[] = JSON.parse(JSON.stringify(getDefaultKeyboardActions()));

    for (const action of actions) {
        if ("effectiveShortcuts" in action && action.effectiveShortcuts) {
            action.effectiveShortcuts = action.defaultShortcuts ? action.defaultShortcuts.slice() : [];
        }
    }

    for (const option of optionService.getOptions()) {
        if (option.name.startsWith("keyboardShortcuts")) {
            let actionName = option.name.substring(17);
            actionName = actionName.charAt(0).toLowerCase() + actionName.slice(1);

            const action = actions.find((ea) => "actionName" in ea && ea.actionName === actionName) as ActionKeyboardShortcut;

            if (action) {
                try {
                    action.effectiveShortcuts = JSON.parse(option.value);
                } catch (e) {
                    log.error(`Could not parse shortcuts for action ${actionName}`);
                }
            } else {
                log.info(`Keyboard action ${actionName} found in database, but not in action definition.`);
            }
        }
    }

    return actions;
}

export default {
    getDefaultKeyboardActions,
    getKeyboardActions
};
