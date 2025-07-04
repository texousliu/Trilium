import { CellComponent } from "tabulator-tables";
import note_autocomplete from "../../../services/note_autocomplete";
import { loadReferenceLinkTitle } from "../../../services/link";
import froca from "../../../services/froca";

export function RelationEditor(cell: CellComponent, onRendered, success, cancel, editorParams){
    //cell - the cell component for the editable cell
    //onRendered - function to call when the editor has been rendered
    //success - function to call to pass thesuccessfully updated value to Tabulator
    //cancel - function to call to abort the edit and return to a normal cell
    //editorParams - params object passed into the editorParams column definition property

    //create and style editor
    const editor = document.createElement("input");
    const $editor = $(editor);
    editor.classList.add("form-control");

    //create and style input
    editor.style.padding = "3px";
    editor.style.width = "100%";
    editor.style.boxSizing = "border-box";

    //Set value of editor to the current value of the cell
    const noteId = cell.getValue();
    if (noteId) {
        const note = froca.getNoteFromCache(noteId);
        editor.value = note.title;
    }

    //set focus on the select box when the editor is selected
    onRendered(function(){
        note_autocomplete.initNoteAutocomplete($editor, {
            allowCreatingNotes: true
        }).on("autocomplete:noteselected", (event, suggestion, dataset) => {
            const notePath = suggestion.notePath;
            if (!notePath) {
                return;
            }

            const noteId = notePath.split("/").at(-1);
            success(noteId);
        });
        editor.focus();
    });

    //return the editor element
    return editor;
};

export function RelationFormatter(cell: CellComponent, formatterParams, onRendered) {
    const noteId = cell.getValue();
    if (!noteId) {
        return "";
    }

    onRendered(async () => {
        const $link = $("<a>");
        $link.addClass("reference-link");
        $link.attr("href", `#root/${noteId}`);
        await loadReferenceLinkTitle($link);
        cell.getElement().appendChild($link[0]);
    });
    return "";
}
