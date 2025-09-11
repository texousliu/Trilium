import { BoardViewData } from ".";
import appContext from "../../../components/app_context";
import FNote from "../../../entities/fnote";
import attributes from "../../../services/attributes";
import { executeBulkActions } from "../../../services/bulk_action";
import note_create from "../../../services/note_create";
import server from "../../../services/server";
import { ColumnMap } from "./data";

export default class BoardApi {

    constructor(
        private byColumn: ColumnMap | undefined,
        public columns: string[],
        private parentNote: FNote,
        private statusAttribute: string,
        private viewConfig: BoardViewData,
        private saveConfig: (newConfig: BoardViewData) => void,
        private setBranchIdToEdit: (branchId: string | undefined) => void
    ) {};

    async createNewItem(column: string) {
        try {
            // Get the parent note path
            const parentNotePath = this.parentNote.noteId;

            // Create a new note as a child of the parent note
            const { note: newNote, branch: newBranch } = await note_create.createNote(parentNotePath, {
                activate: false,
                title: "New item"
            });

            if (newNote && newBranch) {
                await this.changeColumn(newNote.noteId, column);
                this.startEditing(newBranch?.branchId);
            }
        } catch (error) {
            console.error("Failed to create new item:", error);
        }
    }

    async changeColumn(noteId: string, newColumn: string) {
        await attributes.setLabel(noteId, this.statusAttribute, newColumn);
    }

    async removeColumn(column: string) {
        // Remove the value from the notes.
        const noteIds = this.byColumn?.get(column)?.map(item => item.note.noteId) || [];
        await executeBulkActions(noteIds, [
            {
                name: "deleteLabel",
                labelName: this.statusAttribute
            }
        ]);

        this.viewConfig.columns = (this.viewConfig.columns ?? []).filter(col => col.value !== column);
        this.saveConfig(this.viewConfig);
    }

    async insertRowAtPosition(
            column: string,
            relativeToBranchId: string,
            direction: "before" | "after") {
        const { note, branch } = await note_create.createNote(this.parentNote.noteId, {
            activate: false,
            targetBranchId: relativeToBranchId,
            target: direction,
            title: "New item"
        });

        if (!note || !branch) {
            throw new Error("Failed to create note");
        }

        const { noteId } = note;
        await this.changeColumn(noteId, column);
        this.startEditing(branch.branchId);

        return note;
    }

    openNote(noteId: string) {
        appContext.triggerCommand("openInPopup", { noteIdOrPath: noteId });
    }

    startEditing(branchId: string) {
        this.setBranchIdToEdit(branchId);
    }

    dismissEditingTitle() {
        this.setBranchIdToEdit(undefined);
    }

    renameCard(noteId: string, newTitle: string) {
        return server.put(`notes/${noteId}/title`, { title: newTitle.trim() });
    }

}

