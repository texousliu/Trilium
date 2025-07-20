import appContext from "../../../components/app_context";
import attributes from "../../../services/attributes";
import note_create from "../../../services/note_create";

export default class BoardApi {

    constructor(
        private _columns: string[],
        private _parentNoteId: string) {}

    get columns() {
        return this._columns;
    }

    async changeColumn(noteId: string, newColumn: string) {
        await attributes.setLabel(noteId, "status", newColumn);
    }

    openNote(noteId: string) {
        appContext.triggerCommand("openInPopup", { noteIdOrPath: noteId });
    }

    async insertRowAtPosition(
            column: string,
            relativeToBranchId: string,
            direction: "before" | "after",
            open: boolean = true) {
        const { note } = await note_create.createNote(this._parentNoteId, {
            activate: false,
            targetBranchId: relativeToBranchId,
            target: direction
        });

        if (!note) {
            throw new Error("Failed to create note");
        }

        const { noteId } = note;
        await this.changeColumn(noteId, column);
        if (open) {
            this.openNote(noteId);
        }
    }

}
