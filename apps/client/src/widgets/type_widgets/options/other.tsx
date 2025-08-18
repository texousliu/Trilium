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
                optionValueId="eraseEntitiesAfterTimeInSeconds"
                optionTimeScaleId="eraseEntitiesAfterTimeScale"
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