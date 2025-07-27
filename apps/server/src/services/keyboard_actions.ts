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
            friendlyName: t("keyboard_action_names.back-in-note-history"),
            // Mac has a different history navigation shortcuts - https://github.com/zadam/trilium/issues/376
            defaultShortcuts: isMac ? ["CommandOrControl+Left"] : ["Alt+Left"],
            description: t("keyboard_actions.back-in-note-history"),
            scope: "window"
        },
        {
            actionName: "forwardInNoteHistory",
            friendlyName: t("keyboard_action_names.forward-in-note-history"),
            // Mac has a different history navigation shortcuts - https://github.com/zadam/trilium/issues/376
            defaultShortcuts: isMac ? ["CommandOrControl+Right"] : ["Alt+Right"],
            description: t("keyboard_actions.forward-in-note-history"),
            scope: "window"
        },
        {
            actionName: "jumpToNote",
            friendlyName: t("keyboard_action_names.jump-to-note"),
            defaultShortcuts: ["CommandOrControl+J"],
            description: t("keyboard_actions.open-jump-to-note-dialog"),
            scope: "window"
        },
        {
            actionName: "commandPalette",
            friendlyName: t("keyboard_action_names.command-palette"),
            defaultShortcuts: ["CommandOrControl+Shift+J"],
            description: t("keyboard_actions.open-command-palette"),
            scope: "window"
        },
        {
            actionName: "scrollToActiveNote",
            friendlyName: t("keyboard_action_names.scroll-to-active-note"),
            defaultShortcuts: ["CommandOrControl+."],
            description: t("keyboard_actions.scroll-to-active-note"),
            scope: "window"
        },
        {
            actionName: "quickSearch",
            friendlyName: t("keyboard_action_names.quick-search"),
            defaultShortcuts: ["CommandOrControl+S"],
            description: t("keyboard_actions.quick-search"),
            scope: "window"
        },
        {
            actionName: "searchInSubtree",
            friendlyName: t("keyboard_action_names.search-in-subtree"),
            defaultShortcuts: ["CommandOrControl+Shift+S"],
            description: t("keyboard_actions.search-in-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "expandSubtree",
            friendlyName: t("keyboard_action_names.expand-subtree"),
            defaultShortcuts: [],
            description: t("keyboard_actions.expand-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "collapseTree",
            friendlyName: t("keyboard_action_names.collapse-tree"),
            defaultShortcuts: ["Alt+C"],
            description: t("keyboard_actions.collapse-tree"),
            scope: "window"
        },
        {
            actionName: "collapseSubtree",
            friendlyName: t("keyboard_action_names.collapse-subtree"),
            defaultShortcuts: ["Alt+-"],
            description: t("keyboard_actions.collapse-subtree"),
            scope: "note-tree"
        },
        {
            actionName: "sortChildNotes",
            friendlyName: t("keyboard_action_names.sort-child-notes"),
            defaultShortcuts: ["Alt+S"],
            description: t("keyboard_actions.sort-child-notes"),
            scope: "note-tree"
        },

        {
            separator: t("keyboard_actions.creating-and-moving-notes")
        },
        {
            actionName: "createNoteAfter",
            friendlyName: t("keyboard_action_names.create-note-after"),
            defaultShortcuts: ["CommandOrControl+O"],
            description: t("keyboard_actions.create-note-after"),
            scope: "window"
        },
        {
            actionName: "createNoteInto",
            friendlyName: t("keyboard_action_names.create-note-into"),
            defaultShortcuts: ["CommandOrControl+P"],
            description: t("keyboard_actions.create-note-into"),
            scope: "window"
        },
        {
            actionName: "createNoteIntoInbox",
            friendlyName: t("keyboard_action_names.create-note-into-inbox"),
            defaultShortcuts: ["global:CommandOrControl+Alt+P"],
            description: t("keyboard_actions.create-note-into-inbox"),
            scope: "window"
        },
        {
            actionName: "deleteNotes",
            friendlyName: t("keyboard_action_names.delete-notes"),
            defaultShortcuts: ["Delete"],
            description: t("keyboard_actions.delete-note"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteUp",
            friendlyName: t("keyboard_action_names.move-note-up"),
            defaultShortcuts: isMac ? ["Alt+Up"] : ["CommandOrControl+Up"],
            description: t("keyboard_actions.move-note-up"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteDown",
            friendlyName: t("keyboard_action_names.move-note-down"),
            defaultShortcuts: isMac ? ["Alt+Down"] : ["CommandOrControl+Down"],
            description: t("keyboard_actions.move-note-down"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteUpInHierarchy",
            friendlyName: t("keyboard_action_names.move-note-up-in-hierarchy"),
            defaultShortcuts: isMac ? ["Alt+Left"] : ["CommandOrControl+Left"],
            description: t("keyboard_actions.move-note-up-in-hierarchy"),
            scope: "note-tree"
        },
        {
            actionName: "moveNoteDownInHierarchy",
            friendlyName: t("keyboard_action_names.move-note-down-in-hierarchy"),
            defaultShortcuts: isMac ? ["Alt+Right"] : ["CommandOrControl+Right"],
            description: t("keyboard_actions.move-note-down-in-hierarchy"),
            scope: "note-tree"
        },
        {
            actionName: "editNoteTitle",
            friendlyName: t("keyboard_action_names.edit-note-title"),
            defaultShortcuts: ["Enter"],
            description: t("keyboard_actions.edit-note-title"),
            scope: "note-tree"
        },
        {
            actionName: "editBranchPrefix",
            friendlyName: t("keyboard_action_names.edit-branch-prefix"),
            defaultShortcuts: ["F2"],
            description: t("keyboard_actions.edit-branch-prefix"),
            scope: "note-tree"
        },
        {
            actionName: "cloneNotesTo",
            friendlyName: t("keyboard_action_names.clone-notes-to"),
            defaultShortcuts: ["CommandOrControl+Shift+C"],
            description: t("keyboard_actions.clone-notes-to"),
            scope: "window"
        },
        {
            actionName: "moveNotesTo",
            friendlyName: t("keyboard_action_names.move-notes-to"),
            defaultShortcuts: ["CommandOrControl+Shift+X"],
            description: t("keyboard_actions.move-notes-to"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.note-clipboard")
        },

        {
            actionName: "copyNotesToClipboard",
            friendlyName: t("keyboard_action_names.copy-notes-to-clipboard"),
            defaultShortcuts: ["CommandOrControl+C"],
            description: t("keyboard_actions.copy-notes-to-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "pasteNotesFromClipboard",
            friendlyName: t("keyboard_action_names.paste-notes-from-clipboard"),
            defaultShortcuts: ["CommandOrControl+V"],
            description: t("keyboard_actions.paste-notes-from-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "cutNotesToClipboard",
            friendlyName: t("keyboard_action_names.cut-notes-to-clipboard"),
            defaultShortcuts: ["CommandOrControl+X"],
            description: t("keyboard_actions.cut-notes-to-clipboard"),
            scope: "note-tree"
        },
        {
            actionName: "selectAllNotesInParent",
            friendlyName: t("keyboard_action_names.select-all-notes-in-parent"),
            defaultShortcuts: ["CommandOrControl+A"],
            description: t("keyboard_actions.select-all-notes-in-parent"),
            scope: "note-tree"
        },
        {
            actionName: "addNoteAboveToSelection",
            friendlyName: t("keyboard_action_names.add-note-above-to-selection"),
            defaultShortcuts: ["Shift+Up"],
            description: t("keyboard_actions.add-note-above-to-the-selection"),
            scope: "note-tree"
        },
        {
            actionName: "addNoteBelowToSelection",
            friendlyName: t("keyboard_action_names.add-note-below-to-selection"),
            defaultShortcuts: ["Shift+Down"],
            description: t("keyboard_actions.add-note-below-to-selection"),
            scope: "note-tree"
        },
        {
            actionName: "duplicateSubtree",
            friendlyName: t("keyboard_action_names.duplicate-subtree"),
            defaultShortcuts: [],
            description: t("keyboard_actions.duplicate-subtree"),
            scope: "note-tree"
        },

        {
            separator: t("keyboard_actions.tabs-and-windows")
        },
        {
            actionName: "openNewTab",
            friendlyName: t("keyboard_action_names.open-new-tab"),
            defaultShortcuts: isElectron ? ["CommandOrControl+T"] : [],
            description: t("keyboard_actions.open-new-tab"),
            scope: "window"
        },
        {
            actionName: "closeActiveTab",
            friendlyName: t("keyboard_action_names.close-active-tab"),
            defaultShortcuts: isElectron ? ["CommandOrControl+W"] : [],
            description: t("keyboard_actions.close-active-tab"),
            scope: "window"
        },
        {
            actionName: "reopenLastTab",
            friendlyName: t("keyboard_action_names.reopen-last-tab"),
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+T"] : [],
            description: t("keyboard_actions.reopen-last-tab"),
            scope: "window"
        },
        {
            actionName: "activateNextTab",
            friendlyName: t("keyboard_action_names.activate-next-tab"),
            defaultShortcuts: isElectron ? ["CommandOrControl+Tab", "CommandOrControl+PageDown"] : [],
            description: t("keyboard_actions.activate-next-tab"),
            scope: "window"
        },
        {
            actionName: "activatePreviousTab",
            friendlyName: t("keyboard_action_names.activate-previous-tab"),
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+Tab", "CommandOrControl+PageUp"] : [],
            description: t("keyboard_actions.activate-previous-tab"),
            scope: "window"
        },
        {
            actionName: "openNewWindow",
            friendlyName: t("keyboard_action_names.open-new-window"),
            defaultShortcuts: [],
            description: t("keyboard_actions.open-new-window"),
            scope: "window"
        },
        {
            actionName: "toggleTray",
            friendlyName: t("keyboard_action_names.toggle-system-tray-icon"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-tray"),
            scope: "window"
        },
        {
            actionName: "toggleZenMode",
            friendlyName: t("keyboard_action_names.toggle-zen-mode"),
            defaultShortcuts: ["F9"],
            description: t("keyboard_actions.toggle-zen-mode"),
            scope: "window"
        },
        {
            actionName: "firstTab",
            friendlyName: t("keyboard_action_names.switch-to-first-tab"),
            defaultShortcuts: ["CommandOrControl+1"],
            description: t("keyboard_actions.first-tab"),
            scope: "window"
        },
        {
            actionName: "secondTab",
            friendlyName: t("keyboard_action_names.switch-to-second-tab"),
            defaultShortcuts: ["CommandOrControl+2"],
            description: t("keyboard_actions.second-tab"),
            scope: "window"
        },
        {
            actionName: "thirdTab",
            friendlyName: t("keyboard_action_names.switch-to-third-tab"),
            defaultShortcuts: ["CommandOrControl+3"],
            description: t("keyboard_actions.third-tab"),
            scope: "window"
        },
        {
            actionName: "fourthTab",
            friendlyName: t("keyboard_action_names.switch-to-fourth-tab"),
            defaultShortcuts: ["CommandOrControl+4"],
            description: t("keyboard_actions.fourth-tab"),
            scope: "window"
        },
        {
            actionName: "fifthTab",
            friendlyName: t("keyboard_action_names.switch-to-fifth-tab"),
            defaultShortcuts: ["CommandOrControl+5"],
            description: t("keyboard_actions.fifth-tab"),
            scope: "window"
        },
        {
            actionName: "sixthTab",
            friendlyName: t("keyboard_action_names.switch-to-sixth-tab"),
            defaultShortcuts: ["CommandOrControl+6"],
            description: t("keyboard_actions.sixth-tab"),
            scope: "window"
        },
        {
            actionName: "seventhTab",
            friendlyName: t("keyboard_action_names.switch-to-seventh-tab"),
            defaultShortcuts: ["CommandOrControl+7"],
            description: t("keyboard_actions.seventh-tab"),
            scope: "window"
        },
        {
            actionName: "eigthTab",
            friendlyName: t("keyboard_action_names.switch-to-eighth-tab"),
            defaultShortcuts: ["CommandOrControl+8"],
            description: t("keyboard_actions.eight-tab"),
            scope: "window"
        },
        {
            actionName: "ninthTab",
            friendlyName: t("keyboard_action_names.switch-to-ninth-tab"),
            defaultShortcuts: ["CommandOrControl+9"],
            description: t("keyboard_actions.ninth-tab"),
            scope: "window"
        },
        {
            actionName: "lastTab",
            friendlyName: t("keyboard_action_names.switch-to-last-tab"),
            defaultShortcuts: ["CommandOrControl+0"],
            description: t("keyboard_actions.last-tab"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.dialogs")
        },
        {
            friendlyName: t("keyboard_action_names.show-note-source"),
            actionName: "showNoteSource",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-note-source"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.show-options"),
            actionName: "showOptions",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-options"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.show-revisions"),
            actionName: "showRevisions",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-revisions"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.show-recent-changes"),
            actionName: "showRecentChanges",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-recent-changes"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.show-sql-console"),
            actionName: "showSQLConsole",
            defaultShortcuts: ["Alt+O"],
            description: t("keyboard_actions.show-sql-console"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.show-backend-log"),
            actionName: "showBackendLog",
            defaultShortcuts: [],
            description: t("keyboard_actions.show-backend-log"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.show-help"),
            actionName: "showHelp",
            defaultShortcuts: ["F1"],
            description: t("keyboard_actions.show-help"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.show-cheatsheet"),
            actionName: "showCheatsheet",
            defaultShortcuts: ["Shift+F1"],
            description: t("keyboard_actions.show-cheatsheet"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.text-note-operations")
        },

        {
            friendlyName: t("keyboard_action_names.add-link-to-text"),
            actionName: "addLinkToText",
            defaultShortcuts: ["CommandOrControl+L"],
            description: t("keyboard_actions.add-link-to-text"),
            scope: "text-detail"
        },
        {
            friendlyName: t("keyboard_action_names.follow-link-under-cursor"),
            actionName: "followLinkUnderCursor",
            defaultShortcuts: ["CommandOrControl+Enter"],
            description: t("keyboard_actions.follow-link-under-cursor"),
            scope: "text-detail"
        },
        {
            friendlyName: t("keyboard_action_names.insert-date-and-time-to-text"),
            actionName: "insertDateTimeToText",
            defaultShortcuts: ["Alt+T"],
            description: t("keyboard_actions.insert-date-and-time-to-text"),
            scope: "text-detail"
        },
        {
            friendlyName: t("keyboard_action_names.paste-markdown-into-text"),
            actionName: "pasteMarkdownIntoText",
            defaultShortcuts: [],
            description: t("keyboard_actions.paste-markdown-into-text"),
            scope: "text-detail"
        },
        {
            friendlyName: t("keyboard_action_names.cut-into-note"),
            actionName: "cutIntoNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.cut-into-note"),
            scope: "text-detail"
        },
        {
            friendlyName: t("keyboard_action_names.add-include-note-to-text"),
            actionName: "addIncludeNoteToText",
            defaultShortcuts: [],
            description: t("keyboard_actions.add-include-note-to-text"),
            scope: "text-detail"
        },
        {
            friendlyName: t("keyboard_action_names.edit-read-only-note"),
            actionName: "editReadOnlyNote",
            defaultShortcuts: [],
            description: t("keyboard_actions.edit-readonly-note"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.attributes-labels-and-relations")
        },

        {
            friendlyName: t("keyboard_action_names.add-new-label"),
            actionName: "addNewLabel",
            defaultShortcuts: ["Alt+L"],
            description: t("keyboard_actions.add-new-label"),
            scope: "window"
        },
        {
            friendlyName: t("keyboard_action_names.add-new-relation"),
            actionName: "addNewRelation",
            defaultShortcuts: ["Alt+R"],
            description: t("keyboard_actions.create-new-relation"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.ribbon-tabs")
        },

        {
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-classic-editor"),
            actionName: "toggleRibbonTabClassicEditor",
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-classic-editor-toolbar"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabBasicProperties",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-basic-properties"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-basic-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabBookProperties",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-book-properties"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-book-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabFileProperties",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-file-properties"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-file-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabImageProperties",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-image-properties"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-image-properties"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabOwnedAttributes",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-owned-attributes"),
            defaultShortcuts: ["Alt+A"],
            description: t("keyboard_actions.toggle-owned-attributes"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabInheritedAttributes",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-inherited-attributes"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-inherited-attributes"),
            scope: "window"
        },
        // TODO: Remove or change since promoted attributes have been changed.
        {
            actionName: "toggleRibbonTabPromotedAttributes",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-promoted-attributes"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-promoted-attributes"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNoteMap",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-note-map"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-link-map"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNoteInfo",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-note-info"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-note-info"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabNotePaths",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-note-paths"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-note-paths"),
            scope: "window"
        },
        {
            actionName: "toggleRibbonTabSimilarNotes",
            friendlyName: t("keyboard_action_names.toggle-ribbon-tab-similar-notes"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-similar-notes"),
            scope: "window"
        },

        {
            separator: t("keyboard_actions.other")
        },

        {
            actionName: "toggleRightPane",
            friendlyName: t("keyboard_action_names.toggle-right-pane"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-right-pane"),
            scope: "window"
        },
        {
            actionName: "printActiveNote",
            friendlyName: t("keyboard_action_names.print-active-note"),
            defaultShortcuts: [],
            description: t("keyboard_actions.print-active-note"),
            scope: "window"
        },
        {
            actionName: "exportAsPdf",
            friendlyName: t("keyboard_action_names.export-active-note-as-pdf"),
            defaultShortcuts: [],
            description: t("keyboard_actions.export-as-pdf"),
            scope: "window"
        },
        {
            actionName: "openNoteExternally",
            friendlyName: t("keyboard_action_names.open-note-externally"),
            defaultShortcuts: [],
            description: t("keyboard_actions.open-note-externally"),
            scope: "window"
        },
        {
            actionName: "renderActiveNote",
            friendlyName: t("keyboard_action_names.render-active-note"),
            defaultShortcuts: [],
            description: t("keyboard_actions.render-active-note"),
            scope: "window"
        },
        {
            actionName: "runActiveNote",
            friendlyName: t("keyboard_action_names.run-active-note"),
            defaultShortcuts: ["CommandOrControl+Enter"],
            description: t("keyboard_actions.run-active-note"),
            scope: "code-detail"
        },
        {
            actionName: "toggleNoteHoisting",
            friendlyName: t("keyboard_action_names.toggle-note-hoisting"),
            defaultShortcuts: ["Alt+H"],
            description: t("keyboard_actions.toggle-note-hoisting"),
            scope: "window"
        },
        {
            actionName: "unhoist",
            friendlyName: t("keyboard_action_names.unhoist-note"),
            defaultShortcuts: ["Alt+U"],
            description: t("keyboard_actions.unhoist"),
            scope: "window"
        },
        {
            actionName: "reloadFrontendApp",
            friendlyName: t("keyboard_action_names.reload-frontend-app"),
            defaultShortcuts: ["F5", "CommandOrControl+R"],
            description: t("keyboard_actions.reload-frontend-app"),
            scope: "window"
        },
        {
            actionName: "openDevTools",
            friendlyName: t("keyboard_action_names.open-developer-tools"),
            defaultShortcuts: isElectron ? ["CommandOrControl+Shift+I"] : [],
            description: t("keyboard_actions.open-dev-tools"),
            scope: "window"
        },
        {
            actionName: "findInText",
            friendlyName: t("keyboard_action_names.find-in-text"),
            defaultShortcuts: isElectron ? ["CommandOrControl+F"] : [],
            description: t("keyboard_actions.find-in-text"),
            scope: "window"
        },
        {
            actionName: "toggleLeftPane",
            friendlyName: t("keyboard_action_names.toggle-left-pane"),
            defaultShortcuts: [],
            description: t("keyboard_actions.toggle-left-note-tree-panel"),
            scope: "window"
        },
        {
            actionName: "toggleFullscreen",
            friendlyName: t("keyboard_action_names.toggle-full-screen"),
            defaultShortcuts: ["F11"],
            description: t("keyboard_actions.toggle-full-screen"),
            scope: "window"
        },
        {
            actionName: "zoomOut",
            friendlyName: t("keyboard_action_names.zoom-out"),
            defaultShortcuts: isElectron ? ["CommandOrControl+-"] : [],
            description: t("keyboard_actions.zoom-out"),
            scope: "window"
        },
        {
            actionName: "zoomIn",
            friendlyName: t("keyboard_action_names.zoom-in"),
            description: t("keyboard_actions.zoom-in"),
            defaultShortcuts: isElectron ? ["CommandOrControl+="] : [],
            scope: "window"
        },
        {
            actionName: "zoomReset",
            friendlyName: t("keyboard_action_names.reset-zoom-level"),
            description: t("keyboard_actions.reset-zoom-level"),
            defaultShortcuts: isElectron ? ["CommandOrControl+0"] : [],
            scope: "window"
        },
        {
            actionName: "copyWithoutFormatting",
            friendlyName: t("keyboard_action_names.copy-without-formatting"),
            defaultShortcuts: ["CommandOrControl+Alt+C"],
            description: t("keyboard_actions.copy-without-formatting"),
            scope: "text-detail"
        },
        {
            actionName: "forceSaveRevision",
            friendlyName: t("keyboard_action_names.force-save-revision"),
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
