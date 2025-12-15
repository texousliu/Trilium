import { NoteType } from "@triliumnext/commons";
import { useContext } from "preact/hooks";

import Component from "../../components/component";
import NoteContext from "../../components/note_context";
import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { downloadFileNote, openNoteExternally } from "../../services/open";
import { ViewTypeOptions } from "../collections/interface";
import ActionButton from "../react/ActionButton";
import { FormFileUploadActionButton } from "../react/FormFileUpload";
import { useNoteLabel, useNoteLabelBoolean, useNoteProperty, useTriliumOption } from "../react/hooks";
import { ParentComponent } from "../react/react_utils";
import { buildUploadNewFileRevisionListener } from "./FilePropertiesTab";
import { buildUploadNewImageRevisionListener } from "./ImagePropertiesTab";

interface NoteActionsCustomProps {
    note: FNote;
    ntxId: string;
    noteContext: NoteContext;
}

interface NoteActionsCustomInnerProps extends NoteActionsCustomProps {
    noteType: NoteType;
    isReadOnly: boolean;
    isDefaultViewMode: boolean;
    parentComponent: Component;
    viewType: ViewTypeOptions | null | undefined;
}

/**
 * Part of {@link NoteActions} on the new layout, but are rendered with a slight spacing
 * from the rest of the note items and the buttons differ based on the note type.
 */
export default function NoteActionsCustom(props: NoteActionsCustomProps) {
    const { note } = props;
    const noteType = useNoteProperty(note, "type");
    const [ viewType ] = useNoteLabel(note, "viewType");
    const parentComponent = useContext(ParentComponent);
    const [ isReadOnly ] = useNoteLabelBoolean(note, "readOnly");
    const innerProps: NoteActionsCustomInnerProps | null | undefined = noteType && parentComponent && {
        ...props,
        noteType,
        viewType: viewType as ViewTypeOptions | null | undefined,
        isDefaultViewMode: props.noteContext.viewScope?.viewMode === "default",
        parentComponent,
        isReadOnly
    };

    return (innerProps &&
        <div className="note-actions-custom">
            <SwitchSplitOrientationButton {...innerProps} />
            <ToggleReadOnlyButton {...innerProps} />
            <RefreshButton {...innerProps} />
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
        default:
            return null;
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

function CopyReferenceToClipboardButton({ ntxId, noteType, parentComponent }: NoteActionsCustomInnerProps) {
    return (["mermaid", "canvas", "mindMap", "image"].includes(noteType) &&
        <ActionButton
            text={t("image_properties.copy_reference_to_clipboard")}
            icon="bx bx-copy"
            onClick={() => parentComponent?.triggerEvent("copyImageReferenceToClipboard", { ntxId })}
        />
    );
}
//#endregion

function RefreshButton({ note, noteType, isDefaultViewMode, parentComponent, noteContext }: NoteActionsCustomInnerProps) {
    const isEnabled = (note.noteId === "_backendLog" || noteType === "render") && isDefaultViewMode;

    return (isEnabled &&
        <ActionButton
            text={t("backend_log.refresh")}
            icon="bx bx-refresh"
            onClick={() => parentComponent.triggerEvent("refreshData", { ntxId: noteContext.ntxId })}
        />
    );
}

function SwitchSplitOrientationButton({ note, isReadOnly, isDefaultViewMode }: NoteActionsCustomInnerProps) {
    const isShown = note.type === "mermaid" && note.isContentAvailable() && isDefaultViewMode;
    const [ splitEditorOrientation, setSplitEditorOrientation ] = useTriliumOption("splitEditorOrientation");
    const upcomingOrientation = splitEditorOrientation === "horizontal" ? "vertical" : "horizontal";

    return isShown && <ActionButton
        text={upcomingOrientation === "vertical" ? t("switch_layout_button.title_vertical") : t("switch_layout_button.title_horizontal")}
        icon={upcomingOrientation === "vertical" ? "bx bxs-dock-bottom" : "bx bxs-dock-left"}
        onClick={() => setSplitEditorOrientation(upcomingOrientation)}
        disabled={isReadOnly}
    />;
}

function ToggleReadOnlyButton({ note, viewType, isDefaultViewMode }: NoteActionsCustomInnerProps) {
    const [ isReadOnly, setReadOnly ] = useNoteLabelBoolean(note, "readOnly");
    const isEnabled = ([ "mermaid", "mindMap", "canvas" ].includes(note.type) || viewType === "geoMap")
            && note.isContentAvailable() && isDefaultViewMode;

    return isEnabled && <ActionButton
        text={isReadOnly ? t("toggle_read_only_button.unlock-editing") : t("toggle_read_only_button.lock-editing")}
        icon={isReadOnly ? "bx bx-lock-open-alt" : "bx bx-lock-alt"}
        onClick={() => setReadOnly(!isReadOnly)}
    />;
}
