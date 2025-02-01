import { Menu, Tray } from "electron";
import path from "path";
import windowService from "./window.js";
import optionService from "./options.js";
import { fileURLToPath } from "url";
import type { KeyboardActionNames } from "./keyboard_actions_interface.js";
import date_notes from "./date_notes.js";
import type BNote from "../becca/entities/bnote.js";
import becca from "../becca/becca.js";
import becca_service from "../becca/becca_service.js";
import type BRecentNote from "../becca/entities/brecent_note.js";

let tray: Tray;
// `mainWindow.isVisible` doesn't work with `mainWindow.show` and `mainWindow.hide` - it returns `false` when the window
// is minimized
let isVisible = true;

// Inspired by https://github.com/signalapp/Signal-Desktop/blob/dcb5bb672635c4b29a51adec8a5658e3834ec8fc/app/tray_icon.ts#L20
function getIconSize() {
    switch (process.platform) {
        case "darwin":
            return 16;
        case "win32":
            return 32;
        default:
            return 256;
    }
}

function getIconPath() {
    const iconSize = getIconSize();

    return path.join(path.dirname(fileURLToPath(import.meta.url)), "../..", "images", "app-icons", "png", `${iconSize}x${iconSize}.png`);
}

function registerVisibilityListener() {
    const mainWindow = windowService.getMainWindow();
    if (!mainWindow) {
        return;
    }

    // They need to be registered before the tray updater is registered
    mainWindow.on("show", () => {
        isVisible = true;
        updateTrayMenu();
    });
    mainWindow.on("hide", () => {
        isVisible = false;
        updateTrayMenu();
    });

    mainWindow.on("minimize", updateTrayMenu);
    mainWindow.on("maximize", updateTrayMenu);
}

function updateTrayMenu() {
    const mainWindow = windowService.getMainWindow();
    if (!mainWindow) {
        return;
    }

    function triggerKeyboardAction(actionName: KeyboardActionNames) {
        mainWindow?.webContents.send("globalShortcut", actionName);
    }

    function openInSameTab(note: BNote | BRecentNote) {
        mainWindow?.webContents.send("openInSameTab", note.noteId);
    }

    function buildBookmarksMenu() {
        const parentNote = becca.getNoteOrThrow("_lbBookmarks");
        const menuItems: Electron.MenuItemConstructorOptions[] = [];

        for (const bookmarkNote of parentNote?.children) {
            if (bookmarkNote.isLabelTruthy("bookmarkFolder")) {
                // Ignore bookmark folders for now.
                continue;
            }

            menuItems.push({
                label: bookmarkNote.title,
                type: "normal",
                click: () => openInSameTab(bookmarkNote)
            });
        }

        return menuItems;
    }

    function buildRecentNotesMenu() {
        const recentNotes = becca.getRecentNotesFromQuery(`
            SELECT recent_notes.*
            FROM recent_notes
            JOIN notes USING(noteId)
            WHERE notes.isDeleted = 0
            ORDER BY utcDateCreated DESC
            LIMIT 10
        `);
        const menuItems: Electron.MenuItemConstructorOptions[] = [];

        for (const recentNote of recentNotes) {
            menuItems.push({
                label: becca_service.getNoteTitle(recentNote.noteId),
                type: "normal",
                click: () => openInSameTab(recentNote)
            })
        }

        return menuItems;
    }

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "New Note",
            type: "normal",
            click: () => triggerKeyboardAction("createNoteIntoInbox")
        },
        {
            label: "Open today's journal note",
            type: "normal",
            click: () => openInSameTab(date_notes.getTodayNote())
        },
        {
            label: "Bookmarks",
            type: "submenu",
            submenu: buildBookmarksMenu()
        },
        {
            label: "Recent notes",
            type: "submenu",
            submenu: buildRecentNotesMenu()
        },
        { type: "separator" },
        {
            label: isVisible ? "Hide" : "Show",
            type: "normal",
            click: () => {
                if (isVisible) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: "separator" },
        {
            label: "Quit",
            type: "normal",
            click: () => {
                mainWindow.close();
            }
        }
    ]);

    tray?.setContextMenu(contextMenu);
}

function changeVisibility() {
    const window = windowService.getMainWindow();
    if (!window) {
        return;
    }

    if (isVisible) {
        window.hide();
    } else {
        window.show();
        window.focus();
    }
}

function createTray() {
    if (optionService.getOptionBool("disableTray")) {
        return;
    }

    tray = new Tray(getIconPath());
    tray.setToolTip("TriliumNext Notes");
    // Restore focus
    tray.on("click", changeVisibility);
    updateTrayMenu();

    registerVisibilityListener();
}

export default {
    createTray
};
