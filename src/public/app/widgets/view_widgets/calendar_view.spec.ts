import { describe, it } from "vitest";
import utils from "../../services/utils.js";
import FNote from "../../entities/fnote.js";
import froca from "../../services/froca.js";
import FAttribute from "../../entities/fattribute.js";

interface NoteDefinition {
    title: string;
    [key: string]: string;
}

async function buildNotes(notes: NoteDefinition[]) {
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

describe("Building events", () => {
    it("supports start date", async () => {
        const noteIds = await buildNotes([
            { title: "A", "#startDate": "2025-05-05" }
        ]);

        // import CalendarView from "./calendar_view.js";
        const CalendarView = (await import("./calendar_view.js")).default;
        const events = await CalendarView.buildEvents(noteIds);
        console.log(noteIds, events);
    });

});
