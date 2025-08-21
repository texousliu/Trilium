import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "../services/i18n";
import FormTextBox from "./react/FormTextBox";
import { useNoteContext, useSpacedUpdate, useTriliumEventBeta } from "./react/hooks";
import protected_session_holder from "../services/protected_session_holder";
import server from "../services/server";
import "./note_title.css";

export default function NoteTitleWidget() {
    const { note, noteId, componentId } = useNoteContext();
    const [ title, setTitle ] = useState(note?.title);
    const [ isProtected, setProtected ] = useState(note?.isProtected);
    useEffect(() => setTitle(note?.title), [ note?.noteId ]);
    useEffect(() => setProtected(note?.isProtected), [ note?.isProtected ]);

    const spacedUpdate = useSpacedUpdate(async () => {
        if (!note) {
            return;
        }
        protected_session_holder.touchProtectedSessionIfNecessary(note);
        await server.put<void>(`notes/${noteId}/title`, { title: title }, componentId);
    });    

    useTriliumEventBeta("entitiesReloaded", ({ loadResults }) => {        
        if (loadResults.isNoteReloaded(noteId) && note) {
            setProtected(note.isProtected);
        }
        if (loadResults.isNoteReloaded(noteId, componentId)) {
            setTitle(note?.title);
        }
    });

    return (
        <div className="note-title-widget">
            <FormTextBox
                autocomplete="off"
                currentValue={title}
                placeholder={t("note_title.placeholder")}
                className={`note-title ${isProtected ? "protected" : ""}`}
                tabIndex={100}
                onChange={(newValue) => {
                    setTitle(newValue);
                    spacedUpdate.scheduleUpdate();
                }}
            />
        </div>
    );
}
