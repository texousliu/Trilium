import FNote from "../../../entities/fnote";
import contextMenu, { ContextMenuEvent } from "../../../menus/context_menu";
import link_context_menu from "../../../menus/link_context_menu";
import branches from "../../../services/branches";
import { t } from "../../../services/i18n";

export function openCalendarContextMenu(e: ContextMenuEvent, noteId: string, parentNote: FNote) {
    e.preventDefault();
    e.stopPropagation();

    contextMenu.show({
        x: e.pageX,
        y: e.pageY,
        items: [
            ...link_context_menu.getItems(),
            { kind: "separator" },
            {
                title: t("calendar_view.delete_note"),
                uiIcon: "bx bx-trash",
                handler: async () => {
                    const branchId = parentNote.childToBranch[noteId];
                    await branches.deleteNotes([ branchId ], false, false);
                }
            }
        ],
        selectMenuItemHandler: ({ command }) =>  link_context_menu.handleLinkContextMenuItem(command, noteId),
    })
}
