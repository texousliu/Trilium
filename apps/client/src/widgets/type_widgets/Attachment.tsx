import { t } from "i18next";
import { TypeWidgetProps } from "./type_widget";
import "./Attachment.css";
import NoteLink from "../react/NoteLink";
import Button from "../react/Button";
import { useContext } from "preact/hooks";
import { ParentComponent } from "../react/react_utils";
import HelpButton from "../react/HelpButton";

export function AttachmentList({ note }: TypeWidgetProps) {
    return (
        <div className="attachment-list note-detail-printable">
            <AttachmentListHeader noteId={note.noteId} />
        </div>
    )
}

function AttachmentListHeader({ noteId }: { noteId: string }) {
    const parentComponent = useContext(ParentComponent);

    return (
        <div className="links-wrapper">
            <div>
                {t("attachment_list.owning_note")}{" "}<NoteLink notePath={noteId} />
            </div>
            <div className="attachment-actions-toolbar">
                <Button
                    size="small"
                    icon="bx bx-folder-open"
                    text={t("attachment_list.upload_attachments")}
                    onClick={() => parentComponent?.triggerCommand("showUploadAttachmentsDialog", { noteId })}
                />
                &nbsp;
                <HelpButton
                    helpPage="0vhv7lsOLy82"
                    title={t("attachment_list.open_help_page")}
                />
            </div>
        </div>
    )
}
