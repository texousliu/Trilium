import contextMenu, { ContextMenuEvent } from "../../../menus/context_menu";
import dialog from "../../../services/dialog";
import { t } from "../../../services/i18n";
import Api from "./api";

export function openColumnContextMenu(api: Api, event: ContextMenuEvent, column: string) {
    event.preventDefault();
    event.stopPropagation();

    contextMenu.show({
        x: event.pageX,
        y: event.pageY,
        items: [
            {
                title: t("board_view.delete-column"),
                uiIcon: "bx bx-trash",
                async handler() {
                    const confirmed = await dialog.confirm(t("board_view.delete-column-confirmation"));
                    if (!confirmed) {
                        return;
                    }

                    await api.removeColumn(column);
                }
            }
        ],
        selectMenuItemHandler() {}
    });
}
