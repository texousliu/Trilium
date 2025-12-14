import "./NoteTitleActions.css";

import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import CollectionProperties from "../note_bars/CollectionProperties";
import Collapsible from "../react/Collapsible";
import { useNoteContext, useNoteProperty } from "../react/hooks";
import SearchDefinitionTab from "../ribbon/SearchDefinitionTab";

export default function NoteTitleActions() {
    const { note, ntxId } = useNoteContext();
    const isHiddenNote = note && note.noteId !== "_search" && note.noteId.startsWith("_");
    const noteType = useNoteProperty(note, "type");

    return (
        <div className="title-actions">
            {note && noteType === "search" && <SearchProperties note={note} ntxId={ntxId} />}
            {note && !isHiddenNote && noteType === "book" && <CollectionProperties note={note} />}
        </div>
    );
}

function SearchProperties({ note, ntxId }: { note: FNote, ntxId: string | null | undefined }) {
    return (
        <Collapsible
            title={t("search_definition.search_parameters")}
        >
            <SearchDefinitionTab note={note} ntxId={ntxId} hidden={false} />
        </Collapsible>
    );
}
