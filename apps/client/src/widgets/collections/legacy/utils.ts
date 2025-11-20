import { useMemo } from "preact/hooks";
import FNote from "../../../entities/fnote";

/**
 * Filters the note IDs for the legacy view to filter out subnotes that are already included in the note content such as images, included notes.
 */
export function useFilteredNoteIds(note: FNote, noteIds: string[]) {
    return useMemo(() => {
        const includedLinks = note ? note.getRelations().filter((rel) => rel.name === "imageLink" || rel.name === "includeNoteLink") : [];
        const includedNoteIds = new Set(includedLinks.map((rel) => rel.value));
        return noteIds.filter((noteId) => !includedNoteIds.has(noteId) && noteId !== "_hidden");
    }, noteIds);
}
