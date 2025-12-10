import { type ComponentChild } from "preact";

import { t } from "../services/i18n";
import { formatDateTime } from "../utils/formatters";
import { useNoteContext } from "./react/hooks";
import { joinElements } from "./react/react_utils";
import { useNoteMetadata } from "./ribbon/NoteInfoTab";

export default function NoteTitleDetails() {
    const { note } = useNoteContext();
    const { metadata } = useNoteMetadata(note);
    const isHiddenNote = note?.noteId.startsWith("_");

    const items: ComponentChild[] = [
        (!isHiddenNote && metadata?.dateCreated && <li>
            {t("note_title.created_on", { date: formatDateTime(metadata.dateCreated, "medium", "none")} )}
        </li>),
        (!isHiddenNote && metadata?.dateModified && <li>
            {t("note_title.last_modified", { date: formatDateTime(metadata.dateModified, "medium", "none")} )}
        </li>)
    ].filter(item => !!item);

    return (
        <div className="title-details">
            {joinElements(items, " • ")}
        </div>
    );
}
