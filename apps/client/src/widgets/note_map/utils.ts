import appContext from "../../components/app_context";
import FNote from "../../entities/fnote";
import hoisted_note from "../../services/hoisted_note";

export type NoteMapWidgetMode = "ribbon" | "hoisted";

export function rgb2hex(rgb: string) {
    return `#${(rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/) || [])
        .slice(1)
        .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
        .join("")}`;
}

export function getMapRootNoteId(noteId: string, note: FNote, widgetMode: NoteMapWidgetMode): string | null {
    if (noteId && widgetMode === "ribbon") {
        return noteId;
    }

    let mapRootNoteId = note?.getLabelValue("mapRootNoteId");

    if (mapRootNoteId === "hoisted") {
        mapRootNoteId = hoisted_note.getHoistedNoteId();
    } else if (!mapRootNoteId) {
        mapRootNoteId = appContext.tabManager.getActiveContext()?.parentNoteId ?? null;
    }

    return mapRootNoteId;
}
