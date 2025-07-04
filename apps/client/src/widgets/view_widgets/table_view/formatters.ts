import { CellComponent } from "tabulator-tables";
import { loadReferenceLinkTitle } from "../../../services/link.js";

/**
 * Custom formatter to represent a note, with the icon and note title being rendered.
 *
 * The value of the cell must be the note ID.
 */
export function NoteFormatter(cell: CellComponent, formatterParams, onRendered) {
    let noteId = cell.getValue();
    if (!noteId) {
        return "";
    }

    onRendered(async () => {
        const $noteRef = $("<span>");
        const href = `#root/${noteId}`;
        $noteRef.addClass("reference-link");
        $noteRef.attr("data-href", href);

        await loadReferenceLinkTitle($noteRef, href);
        cell.getElement().appendChild($noteRef[0]);
    });
    return "";
}

export function NoteTitleFormatter(cell: CellComponent, formatterParams, onRendered) {
    const { noteId, iconClass } = cell.getRow().getData();
    if (!noteId) {
        return "";
    }

    const $noteRef = $("<span>");
    const href = `#root/${noteId}`;
    $noteRef.addClass("reference-link");
    $noteRef.attr("data-href", href);
    $noteRef.text(cell.getValue());
    $noteRef.prepend($("<span>").addClass(iconClass));

    return $noteRef[0].outerHTML;
}
