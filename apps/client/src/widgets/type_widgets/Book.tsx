import { t } from "../../services/i18n";
import Alert from "../react/Alert";
import { useNoteLabel } from "../react/hooks";
import RawHtml from "../react/RawHtml";
import { TypeWidgetProps } from "./type_widget";
import "./Book.css";

const VIEW_TYPES = [ "list", "grid" ];

export default function Book({ note }: TypeWidgetProps) {
    const [ viewType ] = useNoteLabel(note, "viewType");
    const shouldDisplayNoChildrenWarning = !note.hasChildren() && VIEW_TYPES.includes(viewType ?? "");

    return (
        <div className="note-detail-book note-detail-printable">
            {(shouldDisplayNoChildrenWarning && (
                <Alert type="warning" className="note-detail-book-empty-help">
                    <RawHtml html={t("book.no_children_help")} />
                </Alert>
            ))}
        </div>
    )
}
