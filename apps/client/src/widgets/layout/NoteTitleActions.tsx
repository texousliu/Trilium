import "./NoteTitleActions.css";

import clsx from "clsx";

import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import CollectionProperties from "../note_bars/CollectionProperties";
import { PromotedAttributesContent, usePromotedAttributeData } from "../PromotedAttributes";
import Collapsible from "../react/Collapsible";
import { useNoteContext, useNoteProperty } from "../react/hooks";
import SearchDefinitionTab from "../ribbon/SearchDefinitionTab";

export default function NoteTitleActions() {
    const { note, ntxId, componentId } = useNoteContext();
    const isHiddenNote = note && note.noteId !== "_search" && note.noteId.startsWith("_");
    const noteType = useNoteProperty(note, "type");

    const items = [
        note && <PromotedAttributes note={note} componentId={componentId} />,
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

function PromotedAttributes({ note, componentId }: { note: FNote | null | undefined, componentId: string }) {
    const [ cells, setCells ] = usePromotedAttributeData(note, componentId);
    if (!cells?.length) return false;

    return (note && (
        <Collapsible
            title={t("promoted_attributes.promoted_attributes")}
        >
            <PromotedAttributesContent note={note} componentId={componentId} cells={cells} setCells={setCells} />
        </Collapsible>
    ));
}
