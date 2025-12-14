import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { downloadFileNote, openNoteExternally } from "../../services/open";
import protected_session_holder from "../../services/protected_session_holder";
import ActionButton from "../react/ActionButton";
import { FormFileUploadActionButton } from "../react/FormFileUpload";
import { buildUploadNewFileRevisionListener } from "./FilePropertiesTab";

/**
 * Part of {@link NoteActions} on the new layout, but are rendered with a slight spacing
 * from the rest of the note items and the buttons differ based on the note type.
 */
export default function NoteActionsCustom({ note }: { note: FNote }) {
    return (
        <FileActions note={note} />
    );
}

function FileActions({ note }: { note: FNote }) {
    const canAccessProtectedNote = !note?.isProtected || protected_session_holder.isProtectedSessionAvailable();

    return (note.type === "file" &&
        <>
            <FormFileUploadActionButton
                icon="bx bx-folder-open"
                text={t("file_properties.upload_new_revision")}
                disabled={!canAccessProtectedNote}
                onChange={buildUploadNewFileRevisionListener(note)}
            />

            <ActionButton
                icon="bx bx-link-external"
                text={t("file_properties.open")}
                disabled={note.isProtected}
                onClick={() => openNoteExternally(note.noteId, note.mime)}
            />

            <ActionButton
                icon="bx bx-download"
                text={t("file_properties.download")}
                disabled={!canAccessProtectedNote}
                onClick={() => downloadFileNote(note.noteId)}
            />
        </>
    );
}
