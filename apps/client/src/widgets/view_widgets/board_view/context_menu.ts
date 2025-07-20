import contextMenu from "../../../menus/context_menu.js";
import branches from "../../../services/branches.js";
import { t } from "../../../services/i18n.js";

export function showNoteContextMenu($container: JQuery<HTMLElement>) {
    $container.on("contextmenu", ".board-note", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const $el = $(event.currentTarget);
        const noteId = $el.data("note-id");
        const branchId = $el.data("branch-id");
        if (!noteId) return;

        contextMenu.show({
            x: event.pageX,
            y: event.pageY,
            items: [
                {
                    title: t("board_view.delete-note"),
                    uiIcon: "bx bx-trash",
                    handler: () => branches.deleteNotes([ branchId ], false, false)
                }
            ],
            selectMenuItemHandler: () => {}
        });
    });
}
