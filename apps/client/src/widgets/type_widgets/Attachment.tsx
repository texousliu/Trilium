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
import { useTriliumEvent } from "../react/hooks";
import froca from "../../services/froca";
import Dropdown from "../react/Dropdown";
import Icon from "../react/Icon";
import { FormListItem } from "../react/FormList";
import open from "../../services/open";

/**
 * Displays the full list of attachments of a note and allows the user to interact with them.
 */
export function AttachmentList({ note }: TypeWidgetProps) {
    const [ attachments, setAttachments ] = useState<FAttachment[]>([]);

    function refresh() {
        note.getAttachments().then(attachments => setAttachments(Array.from(attachments)));
    }

    useEffect(refresh, [ note ]);

    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getAttachmentRows().some((att) => att.attachmentId && att.ownerId === note.noteId)) {
            refresh();
        }
    });

    return (
        <div className="attachment-list note-detail-printable">
            <AttachmentListHeader noteId={note.noteId} />

            <div className="attachment-list-wrapper">
                {attachments.length ? (
                    attachments.map(attachment => <AttachmentInfo key={attachment.attachmentId} attachment={attachment} />)
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

/**
 * Displays information about a single attachment.
 */
export function AttachmentDetail({ note, viewScope }: TypeWidgetProps) {
    const [ attachment, setAttachment ] = useState<FAttachment | null | undefined>(undefined);

    useEffect(() => {
        if (!viewScope?.attachmentId) return;
        froca.getAttachment(viewScope.attachmentId).then(setAttachment);
    }, [ viewScope ]);

    return (
        <div className="attachment-detail note-detail-printable">
            <div className="links-wrapper use-tn-links">
                {t("attachment_detail.owning_note")}{" "}
                <NoteLink notePath={note.noteId} />
                {t("attachment_detail.you_can_also_open")}{" "}
                <NoteLink
                    notePath={note.noteId}
                    viewScope={{ viewMode: "attachments" }}
                    title={t("attachment_detail.list_of_all_attachments")}
                />
                <HelpButton
                    helpPage="0vhv7lsOLy82"
                    title={t("attachment_list.open_help_page")}
                />
            </div>

            <div className="attachment-wrapper">
                {attachment !== null ? (
                    attachment && <AttachmentInfo attachment={attachment} isFullDetail />
                ) : (
                    <strong>{t("attachment_detail.attachment_deleted")}</strong>
                )}
            </div>
        </div>
    )
}

function AttachmentInfo({ attachment, isFullDetail }: { attachment: FAttachment, isFullDetail?: boolean }) {
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
                    <AttachmentActions attachment={attachment} />
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

function AttachmentActions({ attachment }: { attachment: FAttachment }) {
    return (
        <div className="attachment-actions-container">
            <Dropdown
                className="attachment-actions"
                text={<Icon icon="bx bx-dots-vertical-rounded" />}
                buttonClassName="icon-action-always-border"
                iconAction
            >
                <FormListItem
                    icon="bx bx-file-find"
                    title={t("attachments_actions.open_externally_title")}
                    onClick={(e) => open.openAttachmentExternally(attachment.attachmentId, attachment.mime)}
                >{t("attachments_actions.open_externally")}</FormListItem>
            </Dropdown>
        </div>
    )
}
