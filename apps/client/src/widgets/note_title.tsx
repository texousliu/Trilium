import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "../services/i18n";
import FormTextBox from "./react/FormTextBox";
import { useNoteContext, useSpacedUpdate } from "./react/hooks";
import protected_session_holder from "../services/protected_session_holder";
import server from "../services/server";

export default function NoteTitleWidget() {
    const { note, noteId, componentId } = useNoteContext();
    const [ title, setTitle ] = useState(note?.title);
    useEffect(() => setTitle(note?.title), [ note?.title ]);

    const spacedUpdate = useSpacedUpdate(async () => {
        if (!note) {
            return;
        }
        protected_session_holder.touchProtectedSessionIfNecessary(note);
        await server.put<void>(`notes/${noteId}/title`, { title: title }, componentId);
    });    

    return (
        <>
            <FormTextBox
                autocomplete="off"
                currentValue={title}
                placeholder={t("note_title.placeholder")}
                className="note-title"
                tabIndex={100}
                onChange={(newValue) => {
                    setTitle(newValue);
                    spacedUpdate.scheduleUpdate();
                }}
            />
        </>
    );
}
