import { t } from "i18next";
import { TypeWidgetProps } from "./type_widget";
import "./Attachment.css";
import NoteLink from "../react/NoteLink";
import Button from "../react/Button";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { ParentComponent } from "../react/react_utils";
import HelpButton from "../react/HelpButton";
import FAttachment from "../../entities/fattachment";
import Alert from "../react/Alert";
import utils from "../../services/utils";
import content_renderer from "../../services/content_renderer";

export function AttachmentList({ note }: TypeWidgetProps) {
    const [ attachments, setAttachments ] = useState<FAttachment[]>([]);

    function refresh() {
        note.getAttachments().then(setAttachments);
    }

    useEffect(refresh, [ note ]);

    return (
        <div className="attachment-list note-detail-printable">
            <AttachmentListHeader noteId={note.noteId} />

            <div className="attachment-list-wrapper">
                {attachments.length ? (
                    attachments.map(attachment => <AttachmentDetail attachment={attachment} />)
                ) : (
                    <Alert type="info">
                        {t("attachment_list.no_attachments")}
                    </Alert>
                )}
            </div>
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

function AttachmentDetail({ attachment, isFullDetail }: { attachment: FAttachment, isFullDetail: boolean }) {
    const contentWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        content_renderer.getRenderedContent(attachment, { imageHasZoom: isFullDetail })
            .then(({ $renderedContent }) => {
                contentWrapper.current?.replaceChildren(...$renderedContent);
            })
    }, [ attachment ]);

    return (
        <div className="attachment-detail-widget">
            <div className="attachment-detail-wrapper">
                <div className="attachment-title-line">
                    <div className="attachment-actions-container"></div>
                    <h4 className="attachment-title">
                        {!isFullDetail ? (
                            <NoteLink
                                notePath={attachment.ownerId}
                                title={attachment.title}
                                viewScope={{
                                    viewMode: "attachments",
                                    attachmentId: attachment.attachmentId
                                }}
                            />
                        ) : (attachment.title)}
                    </h4>
                    <div className="attachment-details">
                        {t("attachment_detail_2.role_and_size", { role: attachment.role, size: utils.formatSize(attachment.contentLength) })}
                    </div>
                    <div style="flex: 1 1;"></div>
                </div>

                <div ref={contentWrapper} className="attachment-content-wrapper" />
            </div>
        </div>
    )
}
