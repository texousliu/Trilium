import FNote from "../../../entities/fnote";
import attributes from "../../../services/attributes";
import note_create from "../../../services/note_create";

export default class BoardApi {

    constructor(
        private parentNote: FNote,
        private statusAttribute: string
    ) {};

    async createNewItem(column: string) {
        try {
            // Get the parent note path
            const parentNotePath = this.parentNote.noteId;

            // Create a new note as a child of the parent note
            const { note: newNote } = await note_create.createNote(parentNotePath, {
                activate: false,
                title: "New item"
            });

            if (newNote) {
                // Set the status label to place it in the correct column
                await this.changeColumn(newNote.noteId, column);

                // Start inline editing of the newly created card
                //this.startInlineEditingCard(newNote.noteId);
            }
        } catch (error) {
            console.error("Failed to create new item:", error);
        }
    }

    async changeColumn(noteId: string, newColumn: string) {
        await attributes.setLabel(noteId, this.statusAttribute, newColumn);
    }

}

