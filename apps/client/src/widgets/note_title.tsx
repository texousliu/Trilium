import { useRef } from "preact/hooks";
import { t } from "../services/i18n";
import FormTextBox from "./react/FormTextBox";
import { useNoteContext, useNoteProperty, useSpacedUpdate } from "./react/hooks";
import protected_session_holder from "../services/protected_session_holder";
import server from "../services/server";
import "./note_title.css";

export default function NoteTitleWidget() {
    const { note, noteId, componentId } = useNoteContext();
    const title = useNoteProperty(note, "title", componentId);
    const isProtected = useNoteProperty(note, "isProtected");
    const newTitle = useRef("");

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
                currentValue={title ?? ""}
                placeholder={t("note_title.placeholder")}
                className={`note-title ${isProtected ? "protected" : ""}`}
                tabIndex={100}
                onChange={(newValue) => {
                    newTitle.current = newValue;
                    spacedUpdate.scheduleUpdate();
                }}
            />
        </div>
    );
}
