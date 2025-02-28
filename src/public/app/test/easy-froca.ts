import utils from "../services/utils.js";
import FNote from "../entities/fnote.js";
import froca from "../services/froca.js";
import FAttribute from "../entities/fattribute.js";

interface NoteDefinition {
    title: string;
    [key: string]: string;
}

/**
 * Creates the given notes with the given title and optionally one or more attributes.
 *
 * For a label to be created, simply pass on a key prefixed with `#` and any desired value.
 *
 * The notes and attributes will be injected in the froca.
 *
 * @param notes
 * @returns an array containing the IDs of the created notes.
 * @example
 * buildNotes([
 *  { title: "A", "#startDate": "2025-05-05" },
 *  { title: "B", "#startDate": "2025-05-07" }
 * ]);
 */
export function buildNotes(notes: NoteDefinition[]) {
    const ids = [];

    for (const noteDef of notes) {
        const fakeNoteId = utils.randomString(6);
        const note = new FNote(froca, {
            noteId: fakeNoteId,
            title: noteDef.title,
            type: "text",
            mime: "text/html",
            isProtected: false,
            blobId: ""
        });
        froca.notes[note.noteId] = note;
        ids.push(note.noteId);

        let position = 0;
        for (const [ key, value ] of Object.entries(noteDef)) {
            if (key.startsWith("#")) {
                const attributeId = utils.randomString(12);
                const attribute = new FAttribute(froca, {
                    noteId: note.noteId,
                    attributeId: attributeId,
                    type: "label",
                    name: key.substring(1),
                    value: value,
                    position: position,
                    isInheritable: false
                });
                froca.attributes[attributeId] = attribute;
                note.attributes.push(attributeId);
            }

            position++;
        }
    }

    return ids;
}
