import { Trans } from "react-i18next";
import { t } from "../../../services/i18n";
import server from "../../../services/server";
import toast from "../../../services/toast";
import Button from "../../react/Button";
import FormText from "../../react/FormText";
import OptionsSection from "./components/OptionsSection";
import TimeSelector from "./components/TimeSelector";

export default function OtherSettings() {
    return (
        <>
            <NoteErasureTimeout />
            <AttachmentErasureTimeout />
            <RevisionSnapshotInterval />
        </>
    )
}

function NoteErasureTimeout() {
    return (
        <OptionsSection title={t("note_erasure_timeout.note_erasure_timeout_title")}>
            <FormText>{t("note_erasure_timeout.note_erasure_description")}</FormText>
            <TimeSelector
                name="erase-entities-after"
                label={t("note_erasure_timeout.erase_notes_after")}
                optionValueId="eraseEntitiesAfterTimeInSeconds" optionTimeScaleId="eraseEntitiesAfterTimeScale"
            />
            <FormText>{t("note_erasure_timeout.manual_erasing_description")}</FormText>
            
            <Button
                text={t("note_erasure_timeout.erase_deleted_notes_now")}
                onClick={() => {
                    server.post("notes/erase-deleted-notes-now").then(() => {
                        toast.showMessage(t("note_erasure_timeout.deleted_notes_erased"));
                    });
                }}
            />
        </OptionsSection>
    )
}

function AttachmentErasureTimeout() {
    return (
        <OptionsSection title={t("attachment_erasure_timeout.attachment_erasure_timeout")}>
            <FormText>{t("attachment_erasure_timeout.attachment_auto_deletion_description")}</FormText>
            <TimeSelector
                name="erase-unused-attachments-after"
                label={t("attachment_erasure_timeout.erase_attachments_after")}
                optionValueId="eraseUnusedAttachmentsAfterSeconds" optionTimeScaleId="eraseUnusedAttachmentsAfterTimeScale"
            />
            <FormText>{t("attachment_erasure_timeout.manual_erasing_description")}</FormText>

            <Button
                text={t("attachment_erasure_timeout.erase_unused_attachments_now")}
                onClick={() => {
                    server.post("notes/erase-unused-attachments-now").then(() => {
                        toast.showMessage(t("attachment_erasure_timeout.unused_attachments_erased"));
                    });
                }}
            />
        </OptionsSection>
    )
}

function RevisionSnapshotInterval() {
    return (
        <OptionsSection title={t("revisions_snapshot_interval.note_revisions_snapshot_interval_title")}>
            <FormText>
                <Trans
                    i18nKey="revisions_snapshot_interval.note_revisions_snapshot_description"
                    components={{ doc: <a href="https://triliumnext.github.io/Docs/Wiki/note-revisions.html" class="external" />}}
                />
            </FormText>
            <TimeSelector
                name="revision-snapshot-time-interval"
                label={t("revisions_snapshot_interval.snapshot_time_interval_label")}
                optionValueId="revisionSnapshotTimeInterval" optionTimeScaleId="revisionSnapshotTimeIntervalTimeScale"
                minimumSeconds={10}
            />
        </OptionsSection>
    )
}