import CollectionProperties from "./note_bars/CollectionProperties";
import { useNoteContext, useNoteProperty } from "./react/hooks";

export default function NoteTitleDetails() {
    const { note } = useNoteContext();
    const noteType = useNoteProperty(note, "type");

    return (
        <div className="title-details">
            {note && noteType === "book" && <CollectionProperties note={note} />}
        </div>
    );
}
