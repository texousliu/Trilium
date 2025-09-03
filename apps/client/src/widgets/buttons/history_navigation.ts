import utils from "../../services/utils.js";
import contextMenu, { MenuCommandItem } from "../../menus/context_menu.js";
import treeService from "../../services/tree.js";
import ButtonFromNoteWidget from "./button_from_note.js";
import type FNote from "../../entities/fnote.js";
import type { CommandNames } from "../../components/app_context.js";
import type { WebContents } from "electron";
import link from "../../services/link.js";

export default class HistoryNavigationButton extends ButtonFromNoteWidget {
    private webContents?: WebContents;

    constructor(launcherNote: FNote, command: string) {
        super();

        this.title(() => launcherNote.title)
            .icon(() => launcherNote.getIcon())
            .command(() => command as CommandNames)
            .titlePlacement("right")
            .buttonNoteIdProvider(() => launcherNote.noteId)
            .onContextMenu((e) => { if (e) this.showContextMenu(e); })
            .class("launcher-button");
    }

    doRender() {
        super.doRender();

        if (utils.isElectron()) {
            this.webContents = utils.dynamicRequire("@electron/remote").getCurrentWebContents();

            // without this, the history is preserved across frontend reloads
            this.webContents?.clearHistory();

            this.refresh();
        }
    }

    async showContextMenu(e: JQuery.ContextMenuEvent) {
        e.preventDefault();

        if (!this.webContents || this.webContents.navigationHistory.length() < 2) {
            return;
        }

        let items: MenuCommandItem<string>[] = [];

        const history = this.webContents.navigationHistory.getAllEntries();
        const activeIndex = this.webContents.navigationHistory.getActiveIndex();

        for (const idx in history) {
            const { notePath } = link.parseNavigationStateFromUrl(history[idx].url);
            if (!notePath) continue;

            const title = await treeService.getNotePathTitle(notePath);

            items.push({
                title,
                command: idx,
                uiIcon:
                    parseInt(idx) === activeIndex
                        ? "bx bx-radio-circle-marked" // compare with type coercion!
                        : parseInt(idx) < activeIndex
                          ? "bx bx-left-arrow-alt"
                          : "bx bx-right-arrow-alt"
            });
        }

        items.reverse();

        if (items.length > 20) {
            items = items.slice(0, 50);
        }

        contextMenu.show({
            x: e.pageX,
            y: e.pageY,
            items,
            selectMenuItemHandler: (item: MenuCommandItem<string>) => {
                if (item && item.command && this.webContents) {
                    const idx = parseInt(item.command, 10);
                    this.webContents.navigationHistory.goToIndex(idx);
                }
            }
        });
    }

    activeNoteChangedEvent() {
        this.refresh();
    }
}
