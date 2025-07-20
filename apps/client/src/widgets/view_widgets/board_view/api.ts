import appContext from "../../../components/app_context";
import FNote from "../../../entities/fnote";
import attributes from "../../../services/attributes";
import note_create from "../../../services/note_create";
import ViewModeStorage from "../view_mode_storage";
import { BoardData } from "./config";
import { ColumnMap, getBoardData } from "./data";

export default class BoardApi {

    private constructor(
        private _columns: string[],
        private _parentNoteId: string,
        private viewStorage: ViewModeStorage<BoardData>,
        private byColumn: ColumnMap) {}

    get columns() {
        return this._columns;
    }

    getColumn(column: string) {
        return this.byColumn.get(column);
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

    async renameColumn(oldValue: string, newValue: string, noteIds: string[]) {
        // Update all notes that have the old status value to the new value
        for (const noteId of noteIds) {
            await attributes.setLabel(noteId, "status", newValue);
        }
    }

    static async build(parentNote: FNote, viewStorage: ViewModeStorage<BoardData>) {
        let persistedData = await viewStorage.restore() ?? {};
        const { byColumn, newPersistedData } = await getBoardData(parentNote, "status", persistedData);
        const columns = Array.from(byColumn.keys()) || [];

        if (newPersistedData) {
            persistedData = newPersistedData;
            viewStorage.store(persistedData);
        }

        return new BoardApi(columns, parentNote.noteId, viewStorage, byColumn);
    }

}
