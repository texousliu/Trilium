import { CellComponent } from "tabulator-tables";
import { loadReferenceLinkTitle } from "../../../services/link.js";

/**
 * Custom formatter to represent a note, with the icon and note title being rendered.
 *
 * The value of the cell must be the note ID.
 */
export function NoteFormatter(cell: CellComponent, _formatterParams, onRendered) {
    let noteId = cell.getValue();
    if (!noteId) {
        return "";
    }

    onRendered(async () => {
        const { $noteRef, href } = buildNoteLink(noteId);
        await loadReferenceLinkTitle($noteRef, href);
        cell.getElement().appendChild($noteRef[0]);
    });
    return "";
}

/**
 * Custom formatter for the note title that is quite similar to {@link NoteFormatter}, but where the title and icons are read from separate fields.
 */
export function NoteTitleFormatter(cell: CellComponent) {
    const { noteId, iconClass } = cell.getRow().getData();
    if (!noteId) {
        return "";
    }

    const { $noteRef } = buildNoteLink(noteId);
    $noteRef.text(cell.getValue());
    $noteRef.prepend($("<span>").addClass(iconClass));

    return $noteRef[0].outerHTML;
}

function buildNoteLink(noteId: string) {
    const $noteRef = $("<span>");
    const href = `#root/${noteId}`;
    $noteRef.addClass("reference-link");
    $noteRef.attr("data-href", href);
    return { $noteRef, href };
}
