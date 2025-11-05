import "./read_only_note_info_bar.css";
import { t } from "../services/i18n";
import { useIsNoteReadOnly, useNoteContext, useTriliumEvent } from "./react/hooks"
import Button from "./react/Button";

export default function ReadOnlyNoteInfoBar(props: {zenModeOnly?: boolean}) {
    const {isReadOnly, enableEditing} = useIsNoteReadOnly();
    const {note} = useNoteContext();

    return <div class={`read-only-note-info-bar-widget ${(isReadOnly) ? "visible" : ""} ${(props.zenModeOnly) ? "zen-mode-only" : ""}`}>
                {isReadOnly && <>
                    {note?.isLabelTruthy("readOnly") ? (
                        <div>{t("read-only-info.read-only-note")}</div>
                    ) : (
                        <div> 
                            {t("read-only-info.auto-read-only-note")}
                            &nbsp;
                            <a class="tn-link"
                               href="https://docs.triliumnotes.org/user-guide/concepts/notes/read-only-notes#automatic-read-only-mode">
                                
                                {t("read-only-info.auto-read-only-learn-more")}
                            </a>
                        </div>
                    )}
                    
                    <Button text={t("read-only-info.edit-note")}
                            icon="bx-pencil" onClick={() => enableEditing()} />
                </>}
            </div>;
}