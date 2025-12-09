import { formatDateTime } from "../utils/formatters";
import { useNoteContext } from "./react/hooks";
import { joinElements } from "./react/react_utils";
import { useNoteMetadata } from "./ribbon/NoteInfoTab";

export default function NoteTitleDetails() {
    const { note } = useNoteContext();
    const { metadata } = useNoteMetadata(note);

    return (
        <div className="title-details">
            {joinElements([
                metadata?.dateCreated && <li>
                    Created on {formatDateTime(metadata.dateCreated, "medium", "none")}
                </li>,
                metadata?.dateModified && <li>
                    Modified on {formatDateTime(metadata.dateModified, "medium", "none")}
                </li>
            ], " • ")}
        </div>
    );
}
