import { CreateChildrenResponse } from "@triliumnext/commons";
import server from "../../../services/server";
import FNote from "../../../entities/fnote";
import { setLabel } from "../../../services/attributes";

interface NewEventOpts {
    title: string;
    startDate: string;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
}

export async function newEvent(parentNote: FNote, { title, startDate, endDate, startTime, endTime }: NewEventOpts) {
    // Create the note.
    const { note } = await server.post<CreateChildrenResponse>(`notes/${parentNote.noteId}/children?target=into`, {
        title,
        content: "",
        type: "text"
    });

    // Set the attributes.
    setLabel(note.noteId, "startDate", startDate);
    if (endDate) {
        setLabel(note.noteId, "endDate", endDate);
    }
    if (startTime) {
        setLabel(note.noteId, "startTime", startTime);
    }
    if (endTime) {
        setLabel(note.noteId, "endTime", endTime);
    }
}
