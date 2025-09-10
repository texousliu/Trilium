import FNote from "../../../entities/fnote";
import attributes from "../../../services/attributes";
import note_create from "../../../services/note_create";

export async function createNewItem(parentNote: FNote, column: string) {
    try {
        // Get the parent note path
        const parentNotePath = parentNote.noteId;
        const statusAttribute = parentNote.getLabelValue("board:groupBy") ?? "status";

        // Create a new note as a child of the parent note
        const { note: newNote } = await note_create.createNote(parentNotePath, {
            activate: false,
            title: "New item"
        });

        if (newNote) {
            // Set the status label to place it in the correct column
            await changeColumn(newNote.noteId, column, statusAttribute);

            // Start inline editing of the newly created card
            //this.startInlineEditingCard(newNote.noteId);
        }
    } catch (error) {
        console.error("Failed to create new item:", error);
    }
}

async function changeColumn(noteId: string, newColumn: string, statusAttribute: string) {
    await attributes.setLabel(noteId, statusAttribute, newColumn);
}
