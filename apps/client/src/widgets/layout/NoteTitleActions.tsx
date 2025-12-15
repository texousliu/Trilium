import "./NoteTitleActions.css";

import clsx from "clsx";

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

    const items = [
        note && noteType === "search" && <SearchProperties note={note} ntxId={ntxId} />,
        note && !isHiddenNote && noteType === "book" && <CollectionProperties note={note} />
    ].filter(Boolean);

    return (
        <div className={clsx("title-actions", items.length > 0 && "visible")}>
            {items}
        </div>
    );
}

function SearchProperties({ note, ntxId }: { note: FNote, ntxId: string | null | undefined }) {
    return (note &&
        <Collapsible
            title={t("search_definition.search_parameters")}
            initiallyExpanded={note.isInHiddenSubtree()} // not saved searches
        >
            <SearchDefinitionTab note={note} ntxId={ntxId} hidden={false} />
        </Collapsible>
    );
}
