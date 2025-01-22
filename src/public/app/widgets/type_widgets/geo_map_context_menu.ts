import appContext from "../../components/app_context.js";
import type { ContextMenuEvent } from "../../menus/context_menu.js";
import contextMenu from "../../menus/context_menu.js";

export default function openContextMenu(noteId: string, e: ContextMenuEvent) {
    contextMenu.show({
        x: e.pageX,
        y: e.pageY,
        items: [
            { title: "Remove from map", command: "deleteFromMap", uiIcon: "bx bx-trash" }
        ],
        selectMenuItemHandler: ({ command }) => {
            if (command) {
                appContext.triggerCommand(command, { noteId });
            }
        }
    });
}
