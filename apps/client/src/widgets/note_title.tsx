import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "../services/i18n";
import FormTextBox from "./react/FormTextBox";
import { useNoteContext, useNoteProperty, useSpacedUpdate } from "./react/hooks";
import protected_session_holder from "../services/protected_session_holder";
import server from "../services/server";
import "./note_title.css";
import { isLaunchBarConfig } from "../services/utils";

export default function NoteTitleWidget() {
    const { note, noteId, componentId, viewScope, noteContext } = useNoteContext();    
    const title = useNoteProperty(note, "title", componentId);    
    const isProtected = useNoteProperty(note, "isProtected");
    const newTitle = useRef("");
    
    const [ isReadOnly, setReadOnly ] = useState<boolean>(false);
    const [ navigationTitle, setNavigationTitle ] = useState<string | null>(null);    
    
    useEffect(() => {
        const isReadOnly = note === null
            || note === undefined
            || (note.isProtected && !protected_session_holder.isProtectedSessionAvailable())
            || isLaunchBarConfig(note.noteId)
            || viewScope?.viewMode !== "default";
        setReadOnly(isReadOnly);
    }, [ note, note?.noteId, note?.isProtected, viewScope?.viewMode ]);

    useEffect(() => {
        if (isReadOnly) {
            noteContext?.getNavigationTitle().then(setNavigationTitle);
        }
    }, [isReadOnly]);

    const spacedUpdate = useSpacedUpdate(async () => {
        if (!note) {
            return;
        }
        protected_session_holder.touchProtectedSessionIfNecessary(note);
        await server.put<void>(`notes/${noteId}/title`, { title: newTitle.current }, componentId);
    });    

    return (
        <div className="note-title-widget">
            <FormTextBox
                autocomplete="off"
                currentValue={(!isReadOnly ? title : navigationTitle) ?? ""}
                placeholder={t("note_title.placeholder")}
                className={`note-title ${isProtected ? "protected" : ""}`}
                tabIndex={100}
                readOnly={isReadOnly}
                onChange={(newValue) => {
                    newTitle.current = newValue;
                    spacedUpdate.scheduleUpdate();
                }}
            />
        </div>
    );
}
