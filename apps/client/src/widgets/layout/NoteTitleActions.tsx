import CollectionProperties from "../note_bars/CollectionProperties";
import { useNoteContext, useNoteProperty } from "../react/hooks";
import "./NoteTitleActions.css";

export default function NoteTitleActions() {
    const { note } = useNoteContext();
    const isHiddenNote = note && note.noteId !== "_search" && note.noteId.startsWith("_");
    const noteType = useNoteProperty(note, "type");

    return (
        <div className="title-actions">
            {note && !isHiddenNote && noteType === "book" && <CollectionProperties note={note} />}
        </div>
    );
}
