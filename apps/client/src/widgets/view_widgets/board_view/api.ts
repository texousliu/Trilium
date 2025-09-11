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



    async reorderColumns(newColumnOrder: string[]) {
        // Update the column order in persisted data
        if (!this.persistedData.columns) {
            this.persistedData.columns = [];
        }

        // Create a map of existing column data
        const columnDataMap = new Map();
        this.persistedData.columns.forEach(col => {
            columnDataMap.set(col.value, col);
        });

        // Reorder columns based on new order
        this.persistedData.columns = newColumnOrder.map(columnValue => {
            return columnDataMap.get(columnValue) || { value: columnValue };
        });

        // Update internal columns array
        this._columns = newColumnOrder;

        await this.viewStorage.store(this.persistedData);
    }

    async refresh(parentNote: FNote) {
        // Refresh the API data by re-fetching from the parent note

        // Use the current in-memory persisted data instead of restoring from storage
        // This ensures we don't lose recent updates like column renames

        // Update internal state
        this.byColumn = byColumn;

        if (newPersistedData) {
            this.persistedData = newPersistedData;
            this.viewStorage.store(this.persistedData);
        }

        // Use the order from persistedData.columns, then add any new columns found
        const orderedColumns = this.persistedData.columns?.map(col => col.value) || [];
        const allColumns = Array.from(byColumn.keys());
        const newColumns = allColumns.filter(col => !orderedColumns.includes(col));
        this._columns = [...orderedColumns, ...newColumns];
    }

    static async build(parentNote: FNote, viewStorage: ViewModeStorage<BoardData>) {
        const statusAttribute = parentNote.getLabelValue("board:groupBy") ?? "status";

        let persistedData = await viewStorage.restore() ?? {};

        return new BoardApi(columns, parentNote.noteId, viewStorage, byColumn, persistedData, statusAttribute);
    }

}
