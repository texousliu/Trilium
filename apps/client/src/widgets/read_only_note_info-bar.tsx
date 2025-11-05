import "./read-only-note-info-bar.css";
import { t } from "../services/i18n";
import { useCallback, useEffect, useState } from "preact/hooks";
import { useNoteContext, useTriliumEvent } from "./react/hooks"
import appContext from "../components/app_context";
import Button from "./react/Button";
import FNote from "../entities/fnote";
import NoteContext from "../components/note_context";
import options from "../services/options";
import protected_session_holder from "../services/protected_session_holder";

export default function ReadOnlyNoteInfoBar() {
    const {isReadOnly, enableEditing} = useIsReadOnly();
    const {note} = useNoteContext();

    return <div class={`read-only-note-info-bar-widget ${(isReadOnly) ? " visible" : ""}`}>
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

function useIsReadOnly() {
    const {note, noteContext} = useNoteContext();
    const [isReadOnly, setIsReadOnly] = useState(false);

    const enableEditing = useCallback(() => {
        if (noteContext?.viewScope) {
            noteContext.viewScope.readOnlyTemporarilyDisabled = true;
            appContext.triggerEvent("readOnlyTemporarilyDisabled", {noteContext});
        }
    }, [noteContext]);

    useEffect(() => {
        if (note && noteContext) {
            isNoteReadOnly(note, noteContext).then((readOnly) => {
                setIsReadOnly(readOnly);
            });
        }
    }, [note, noteContext]);

    useTriliumEvent("readOnlyTemporarilyDisabled", ({noteContext: eventNoteContext}) => {
        if (noteContext?.ntxId === eventNoteContext.ntxId) {
            setIsReadOnly(false);
        }
    });

    return {isReadOnly, enableEditing};
}

async function isNoteReadOnly(note: FNote, noteContext: NoteContext) {

    if (note.isProtected && !protected_session_holder.isProtectedSessionAvailable()) {
        return false;
    }

    if (options.is("databaseReadonly")) {
        return false;
    }

    if (noteContext.viewScope?.viewMode !== "default" || !await noteContext.isReadOnly()) {
        return false;
    }

    return true;
}