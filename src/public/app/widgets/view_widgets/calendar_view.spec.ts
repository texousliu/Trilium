import $ from "jquery";
(window as any).$ = $;

import { beforeAll, describe, it, vi } from "vitest";
import utils from "../../services/utils.js";

interface NoteDefinition {
    title: string;
    [key: string]: string;
}

async function buildNotes(notes: NoteDefinition[]) {
    const ids = [];

    for (const noteDef of notes) {
        const FNote = (await import("../../entities/fnote.js")).default;
        const FAttribute = (await import("../../entities/fattribute.js")).default;
        const froca = (await import("../../services/froca.js")).default;

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

        console.log("Attributes", note.getOwnedAttributes());
    }

    return ids;
}

describe("Building events", () => {

    beforeAll(async () => {
        (window as any).WebSocket = () => {};
        (window as any).glob = {
            isMainWindow: true
        };

        vi.mock("../../services/ws.js", () => {
            return {
                default: {
                    subscribeToMessages(callback: (message: unknown) => void) {
                        // Do nothing.
                    }
                }
            }
        });

        vi.mock("../../services/server.js", () => {
            return {
                default: {
                    async get(url: string) {
                        if (url === "options") {
                            return {};
                        }

                        if (url === "keyboard-actions") {
                            return [];
                        }

                        if (url === "tree") {
                            return {
                                branches: [],
                                notes: [],
                                attributes: []
                            }
                        }
                    }
                }
            };
        });
    });

    it("supports start date", async () => {
        const noteIds = await buildNotes([
            { title: "A", "#startDate": "2025-05-05" }
        ]);

        // import CalendarView from "./calendar_view.js";
        const FNote = (await import("../../entities/fnote.js")).default;
        const froca = (await import("../../services/froca.js"));
        const CalendarView = (await import("./calendar_view.js")).default;
        const events = CalendarView.buildEvents(noteIds);
        console.log(noteIds, events);
    });

});
