import { NoteType } from "@triliumnext/commons";
import { useNoteContext } from "./react/hooks"
import FNote from "../entities/fnote";
import protected_session_holder from "../services/protected_session_holder";
import { useEffect, useState } from "preact/hooks";
import NoteContext from "../components/note_context";

/**
 * A `NoteType` altered by the note detail widget, taking into consideration whether the note is editable or not and adding special note types such as an empty one,
 * for protected session or attachment information.
 */
type ExtendedNoteType = Exclude<NoteType, "launcher" | "text" | "code"> | "empty" | "readOnlyCode" | "readOnlyText" | "editableText" | "editableCode" | "attachmentDetail" | "attachmentList" |  "protectedSession" | "aiChat";

export default function NoteDetail() {
    const { note, type } = useNoteInfo();

    return <p>Note detail goes here! {note?.title} of {type}</p>
}

/** Manages both note changes and changes to the widget type, which are asynchronous. */
function useNoteInfo() {
    const { note: actualNote, noteContext } = useNoteContext();
    const [ note, setNote ] = useState<FNote | null | undefined>();
    const [ type, setType ] = useState<ExtendedNoteType>();

    useEffect(() => {
        getWidgetType(actualNote, noteContext).then(type => {
            setNote(actualNote);
            setType(type);
        });
    }, [ actualNote, noteContext ]);

    return { note, type };
}

async function getWidgetType(note: FNote | null | undefined, noteContext: NoteContext | undefined): Promise<ExtendedNoteType> {
    if (!note) {
        return "empty";
    }

    const type = note.type;
    let resultingType: ExtendedNoteType;

    if (noteContext?.viewScope?.viewMode === "source") {
        resultingType = "readOnlyCode";
    } else if (noteContext?.viewScope && noteContext.viewScope.viewMode === "attachments") {
        resultingType = noteContext.viewScope.attachmentId ? "attachmentDetail" : "attachmentList";
    } else if (type === "text" && (await noteContext?.isReadOnly())) {
        resultingType = "readOnlyText";
    } else if ((type === "code" || type === "mermaid") && (await noteContext?.isReadOnly())) {
        resultingType = "readOnlyCode";
    } else if (type === "text") {
        resultingType = "editableText";
    } else if (type === "code") {
        resultingType = "editableCode";
    } else if (type === "launcher") {
        resultingType = "doc";
    } else {
        resultingType = type;
    }

    if (note.isProtected && !protected_session_holder.isProtectedSessionAvailable()) {
        resultingType = "protectedSession";
    }

    return resultingType;
}
