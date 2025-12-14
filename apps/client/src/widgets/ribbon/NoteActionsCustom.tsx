import { NoteType } from "@triliumnext/commons";
import { useContext } from "preact/hooks";

import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { downloadFileNote, openNoteExternally } from "../../services/open";
import ActionButton from "../react/ActionButton";
import { FormFileUploadActionButton } from "../react/FormFileUpload";
import { useNoteProperty } from "../react/hooks";
import { ParentComponent } from "../react/react_utils";
import { buildUploadNewFileRevisionListener } from "./FilePropertiesTab";
import { buildUploadNewImageRevisionListener } from "./ImagePropertiesTab";

interface NoteActionsCustomProps {
    note: FNote;
    ntxId: string;
}

interface NoteActionsCustomInnerProps extends NoteActionsCustomProps {
    noteType: NoteType;
}

/**
 * Part of {@link NoteActions} on the new layout, but are rendered with a slight spacing
 * from the rest of the note items and the buttons differ based on the note type.
 */
export default function NoteActionsCustom(props: NoteActionsCustomProps) {
    const noteType = useNoteProperty(props.note, "type");
    const innerProps: NoteActionsCustomInnerProps | undefined = noteType && {
        ...props,
        noteType
    };

    return (innerProps &&
        <div className="note-actions-custom">
            <CopyReferenceToClipboardButton {...innerProps} />
            <NoteActionsCustomInner {...innerProps} />
        </div>
    );
}

//#region Note type mappings
function NoteActionsCustomInner(props: NoteActionsCustomInnerProps) {
    switch (props.note.type) {
        case "file":
            return <FileActions {...props} />;
        case "image":
            return <ImageActions {...props} />;
    }
}

function FileActions(props: NoteActionsCustomInnerProps) {
    return (
        <>
            <UploadNewRevisionButton {...props} onChange={buildUploadNewFileRevisionListener(props.note)} />
            <OpenExternallyButton {...props} />
            <DownloadFileButton {...props} />
        </>
    );
}

function ImageActions(props: NoteActionsCustomInnerProps) {
    return (
        <>
            <UploadNewRevisionButton {...props} onChange={buildUploadNewImageRevisionListener(props.note)} />
            <OpenExternallyButton {...props} />
            <DownloadFileButton {...props} />
        </>
    );
}
//#endregion

//#region Shared buttons
function UploadNewRevisionButton({ note, onChange }: NoteActionsCustomInnerProps & {
    onChange: (files: FileList | null) => void;
}) {
    return (
        <FormFileUploadActionButton
            icon="bx bx-folder-open"
            text={t("image_properties.upload_new_revision")}
            disabled={!note.isContentAvailable()}
            onChange={onChange}
        />
    );
}

function OpenExternallyButton({ note }: NoteActionsCustomInnerProps) {
    return (
        <ActionButton
            icon="bx bx-link-external"
            text={t("file_properties.open")}
            disabled={note.isProtected}
            onClick={() => openNoteExternally(note.noteId, note.mime)}
        />
    );
}

function DownloadFileButton({ note }: NoteActionsCustomInnerProps) {
    return (
        <ActionButton
            icon="bx bx-download"
            text={t("file_properties.download")}
            disabled={!note.isContentAvailable()}
            onClick={() => downloadFileNote(note.noteId)}
        />
    );
}

function CopyReferenceToClipboardButton({ ntxId, noteType }: NoteActionsCustomInnerProps) {
    const parentComponent = useContext(ParentComponent);

    return (["mermaid", "canvas", "mindMap", "image"].includes(noteType) &&
        <ActionButton
            text={t("image_properties.copy_reference_to_clipboard")}
            icon="bx bx-copy"
            onClick={() => parentComponent?.triggerEvent("copyImageReferenceToClipboard", { ntxId })}
        />
    );
}
//#endregion
