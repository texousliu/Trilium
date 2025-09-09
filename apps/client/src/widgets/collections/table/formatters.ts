import { CellComponent } from "tabulator-tables";
import froca from "../../../services/froca.js";
import FNote from "../../../entities/fnote.js";

/**
 * Custom formatter to represent a note, with the icon and note title being rendered.
 *
 * The value of the cell must be the note ID.
 */
export function NoteFormatter(cell: CellComponent, _formatterParams, onRendered): string {
    let noteId = cell.getValue();
    if (!noteId) {
        return "";
    }

    function buildLink(note: FNote | undefined) {
        if (!note) {
            return;
        }

        const iconClass = note.getIcon();
        const title = note.title;
        const { $noteRef } = buildNoteLink(noteId, title, iconClass, note.getColorClass());
        return $noteRef[0];
    }

    const cachedNote = froca.getNoteFromCache(noteId);
    if (cachedNote) {
        // Cache hit, build the link immediately
        const el = buildLink(cachedNote);
        return el?.outerHTML ?? "";
    } else {
        // Cache miss, load the note asynchronously
        onRendered(async () => {
            const note = await froca.getNote(noteId);
            if (!note) {
                return;
            }

            const el = buildLink(note);
            if (el) {
                cell.getElement().appendChild(el);
            }
        });

        return "";
    }
}

function buildNoteLink(noteId: string, title: string, iconClass: string, colorClass?: string) {
    const $noteRef = $("<span>");
    const href = `#root/${noteId}`;
    return { $noteRef, href };
}
