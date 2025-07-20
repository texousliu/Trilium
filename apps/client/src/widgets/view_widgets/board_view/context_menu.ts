import contextMenu from "../../../menus/context_menu.js";
import link_context_menu from "../../../menus/link_context_menu.js";
import branches from "../../../services/branches.js";
import { t } from "../../../services/i18n.js";
import BoardApi from "./api.js";

interface ShowNoteContextMenuArgs {
    $container: JQuery<HTMLElement>;
    api: BoardApi;
}

export function showNoteContextMenu({ $container, api }: ShowNoteContextMenuArgs) {
    $container.on("contextmenu", ".board-note", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const $el = $(event.currentTarget);
        const noteId = $el.data("note-id");
        const branchId = $el.data("branch-id");
        const column = $el.closest(".board-column").data("column");
        if (!noteId) return;

        contextMenu.show({
            x: event.pageX,
            y: event.pageY,
            items: [
                ...link_context_menu.getItems(),
                { title: "----" },
                {
                    title: t("board_view.move-to"),
                    uiIcon: "bx bx-transfer",
                    items: api.columns.map(columnToMoveTo => ({
                        title: columnToMoveTo,
                        enabled: columnToMoveTo !== column,
                        handler: () => api.changeColumn(noteId, columnToMoveTo)
                    }))
                },
                { title: "----" },
                {
                    title: t("board_view.insert-above"),
                    uiIcon: "bx bx-list-plus",
                    handler: () => api.insertRowAtPosition(column, branchId, "before")
                },
                {
                    title: t("board_view.insert-below"),
                    uiIcon: "bx bx-empty",
                    handler: () => api.insertRowAtPosition(column, branchId, "after")
                },
                { title: "----" },
                {
                    title: t("board_view.delete-note"),
                    uiIcon: "bx bx-trash",
                    handler: () => branches.deleteNotes([ branchId ], false, false)
                }
            ],
            selectMenuItemHandler: ({ command }) =>  link_context_menu.handleLinkContextMenuItem(command, noteId),
        });
    });
}
