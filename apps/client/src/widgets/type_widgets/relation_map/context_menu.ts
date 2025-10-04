import { RefObject } from "preact";
import appContext from "../../../components/app_context";
import FNote from "../../../entities/fnote";
import contextMenu from "../../../menus/context_menu";
import dialog from "../../../services/dialog";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import RelationMapApi from "./api";

export function buildNoteContextMenuHandler(note: FNote | null | undefined, mapApiRef: RefObject<RelationMapApi>) {
    return (e: MouseEvent) => {
        if (!note) return;
        e.preventDefault();

        contextMenu.show({
            x: e.pageX,
            y: e.pageY,
            items: [
                {
                    title: t("relation_map.open_in_new_tab"),
                    uiIcon: "bx bx-empty",
                    handler: () => appContext.tabManager.openTabWithNoteWithHoisting(note.noteId)
                },
                {
                    title: t("relation_map.remove_note"),
                    uiIcon: "bx bx-trash",
                    handler: async () => {
                        if (!note) return;
                        const result = await dialog.confirmDeleteNoteBoxWithNote(note.title);
                        if (typeof result !== "object" || !result.confirmed) return;

                        mapApiRef.current?.removeItem(note.noteId, result.isDeleteNoteChecked);
                    }
                },
                {
                    title: t("relation_map.edit_title"),
                    uiIcon: "bx bx-pencil",
                    handler: async () => {
                        const title = await dialog.prompt({
                            title: t("relation_map.rename_note"),
                            message: t("relation_map.enter_new_title"),
                            defaultValue: note?.title,
                        });

                        if (!title) {
                            return;
                        }

                        await server.put(`notes/${note.noteId}/title`, { title });
                    }
                }
            ],
            selectMenuItemHandler() {}
        })
    };
}
