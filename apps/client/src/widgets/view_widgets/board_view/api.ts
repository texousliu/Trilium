import appContext from "../../../components/app_context";
import FNote from "../../../entities/fnote";
import attributes from "../../../services/attributes";
import { executeBulkActions } from "../../../services/bulk_action";
import note_create from "../../../services/note_create";
import ViewModeStorage from "../view_mode_storage";
import { BoardData } from "./config";
import { ColumnMap, getBoardData } from "./data";

export default class BoardApi {

    private constructor(
        private _columns: string[],
        private _parentNoteId: string,
        private viewStorage: ViewModeStorage<BoardData>,
        private byColumn: ColumnMap,
        private persistedData: BoardData,
        private _statusAttribute: string) {}

    get columns() {
        return this._columns;
    }

    get statusAttribute() {
        return this._statusAttribute;
    }

    getColumn(column: string) {
        return this.byColumn.get(column);
    }

    async changeColumn(noteId: string, newColumn: string) {
        await attributes.setLabel(noteId, this._statusAttribute, newColumn);
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
            target: direction,
            title: "New item"
        });

        if (!note) {
            throw new Error("Failed to create note");
        }

        const { noteId } = note;
        await this.changeColumn(noteId, column);
        if (open) {
            this.openNote(noteId);
        }

        return note;
    }

    async renameColumn(oldValue: string, newValue: string, noteIds: string[]) {
        // Change the value in the notes.
        await executeBulkActions(noteIds, [
            {
                name: "updateLabelValue",
                labelName: this._statusAttribute,
                labelValue: newValue
            }
        ]);

        // Rename the column in the persisted data.
        for (const column of this.persistedData.columns || []) {
            if (column.value === oldValue) {
                column.value = newValue;
            }
        }
        await this.viewStorage.store(this.persistedData);
    }

    async removeColumn(column: string) {
        // Remove the value from the notes.
        const noteIds = this.byColumn.get(column)?.map(item => item.note.noteId) || [];
        await executeBulkActions(noteIds, [
            {
                name: "deleteLabel",
                labelName: this._statusAttribute
            }
        ]);

        this.persistedData.columns = (this.persistedData.columns ?? []).filter(col => col.value !== column);
        this.viewStorage.store(this.persistedData);
    }

    async createColumn(columnValue: string) {
        // Add the new column to persisted data if it doesn't exist
        if (!this.persistedData.columns) {
            this.persistedData.columns = [];
        }

        const existingColumn = this.persistedData.columns.find(col => col.value === columnValue);
        if (!existingColumn) {
            this.persistedData.columns.push({ value: columnValue });
            await this.viewStorage.store(this.persistedData);
        }

        return columnValue;
    }

    static async build(parentNote: FNote, viewStorage: ViewModeStorage<BoardData>) {
        const statusAttribute = parentNote.getLabelValue("board:groupBy") ?? "status";

        let persistedData = await viewStorage.restore() ?? {};
        const { byColumn, newPersistedData } = await getBoardData(parentNote, statusAttribute, persistedData);
        const columns = Array.from(byColumn.keys()) || [];

        if (newPersistedData) {
            persistedData = newPersistedData;
            viewStorage.store(persistedData);
        }

        return new BoardApi(columns, parentNote.noteId, viewStorage, byColumn, persistedData, statusAttribute);
    }

}
