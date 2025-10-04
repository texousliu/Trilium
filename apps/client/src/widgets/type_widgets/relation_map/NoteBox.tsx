import { useCallback, useEffect, useState } from "preact/hooks";
import { useNoteProperty } from "../../react/hooks";
import froca from "../../../services/froca";
import contextMenu from "../../../menus/context_menu";
import { t } from "../../../services/i18n";
import appContext from "../../../components/app_context";
import dialog from "../../../services/dialog";
import server from "../../../services/server";
import { JsPlumbItem } from "./jsplumb";
import FNote from "../../../entities/fnote";
import RelationMapApi, { MapDataNoteEntry } from "./api";
import { RefObject } from "preact";
import NoteLink from "../../react/NoteLink";
import { idToNoteId, noteIdToId } from "./utils";

const NOTE_BOX_SOURCE_CONFIG = {
    filter: ".endpoint",
    anchor: "Continuous",
    connectorStyle: { stroke: "#000", strokeWidth: 1 },
    connectionType: "basic",
    extract: {
        action: "the-action"
    }
};

const NOTE_BOX_TARGET_CONFIG = {
    dropOptions: { hoverClass: "dragHover" },
    anchor: "Continuous",
    allowLoopback: true
};

interface NoteBoxProps extends MapDataNoteEntry {
    mapApiRef: RefObject<RelationMapApi>;
}

export function NoteBox({ noteId, x, y, mapApiRef }: NoteBoxProps) {
    const [ note, setNote ] = useState<FNote | null>();
    const title = useNoteProperty(note, "title");
    useEffect(() => {
        froca.getNote(noteId).then(setNote);
    }, [ noteId ]);

    const contextMenuHandler = useCallback((e: MouseEvent) => {
        e.preventDefault();
        contextMenu.show({
            x: e.pageX,
            y: e.pageY,
            items: [
                {
                    title: t("relation_map.open_in_new_tab"),
                    uiIcon: "bx bx-empty",
                    handler: () => appContext.tabManager.openTabWithNoteWithHoisting(noteId)
                },
                {
                    title: t("relation_map.remove_note"),
                    uiIcon: "bx bx-trash",
                    handler: async () => {
                        if (!note) return;
                        const result = await dialog.confirmDeleteNoteBoxWithNote(note.title);
                        if (typeof result !== "object" || !result.confirmed) return;

                        mapApiRef.current?.removeItem(noteId, result.isDeleteNoteChecked);
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

                        await server.put(`notes/${noteId}/title`, { title });
                    }
                }
            ],
            selectMenuItemHandler() {}
        })
    }, [ note ]);

    return note && (
        <JsPlumbItem
            id={noteIdToId(noteId)}
            className={`note-box ${note?.getCssClass()}`}
            onContextMenu={contextMenuHandler}
            x={x} y={y}
            draggable={{
                start() {},
                drag() {},
                stop(params) {
                    const noteId = idToNoteId(params.el.id);
                    const [ x, y ] = params.pos;
                    mapApiRef.current?.moveNote(noteId, x, y);
                },
            }}
            sourceConfig={NOTE_BOX_SOURCE_CONFIG}
            targetConfig={NOTE_BOX_TARGET_CONFIG}
        >
            <NoteLink className="title" title={title} notePath={noteId} noTnLink noContextMenu />
            <div className="endpoint" title={t("relation_map.start_dragging_relations")} />
        </JsPlumbItem>
    )
}
