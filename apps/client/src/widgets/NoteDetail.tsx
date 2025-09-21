import { NoteType } from "@triliumnext/commons";
import { useNoteContext, useTriliumEvent } from "./react/hooks"
import FNote from "../entities/fnote";
import protected_session_holder from "../services/protected_session_holder";
import { useEffect, useState } from "preact/hooks";
import NoteContext from "../components/note_context";
import Empty from "./type_widgets/Empty";
import { VNode } from "preact";
import Doc from "./type_widgets/Doc";
import { TypeWidgetProps } from "./type_widgets/type_widget";
import ProtectedSession from "./type_widgets/ProtectedSession";
import Book from "./type_widgets/Book";
import ContentWidget from "./type_widgets/ContentWidget";
import WebView from "./type_widgets/WebView";
import "./NoteDetail.css";
import File from "./type_widgets/File";
import Image from "./type_widgets/Image";
import { ReadOnlyCode, EditableCode } from "./type_widgets/code/Code";
import Mermaid from "./type_widgets/Mermaid";
import MindMap from "./type_widgets/MindMap";
import { AttachmentDetail, AttachmentList } from "./type_widgets/Attachment";
import ReadOnlyText from "./type_widgets/text/ReadOnlyText";

/**
 * A `NoteType` altered by the note detail widget, taking into consideration whether the note is editable or not and adding special note types such as an empty one,
 * for protected session or attachment information.
 */
type ExtendedNoteType = Exclude<NoteType, "launcher" | "text" | "code"> | "empty" | "readOnlyCode" | "readOnlyText" | "editableText" | "editableCode" | "attachmentDetail" | "attachmentList" |  "protectedSession" | "aiChat";

/**
 * The note detail is in charge of rendering the content of a note, by determining its type (e.g. text, code) and using the appropriate view widget.
 *
 * Apart from that:
 * - It applies a full-height style depending on the content type (e.g. canvas notes).
 * - Focuses the content when switching tabs.
 */
export default function NoteDetail() {
    const { note, type, noteContext, parentComponent } = useNoteInfo();
    const { ntxId, viewScope } = noteContext ?? {};
    const [ correspondingWidget, setCorrespondingWidget ] = useState<VNode>();
    const isFullHeight = checkFullHeight(noteContext, type);

    const props: TypeWidgetProps = {
        note: note!,
        viewScope,
        ntxId,
        parentComponent,
        noteContext
    };
    useEffect(() => setCorrespondingWidget(getCorrespondingWidget(type, props)), [ note, viewScope, type ]);

    // Automatically focus the editor.
    useTriliumEvent("activeNoteChanged", () => {
        // Restore focus to the editor when switching tabs, but only if the note tree is not already focused.
        if (!document.activeElement?.classList.contains("fancytree-title")) {
            parentComponent.triggerCommand("focusOnDetail", { ntxId });
        }
    });

    return (
        <div class={`note-detail ${isFullHeight ? "full-height" : ""}`}>
            {correspondingWidget || <p>Note detail goes here! {note?.title} of {type}</p>}
        </div>
    );
}

/** Manages both note changes and changes to the widget type, which are asynchronous. */
function useNoteInfo() {
    const { note: actualNote, noteContext, parentComponent } = useNoteContext();
    const [ note, setNote ] = useState<FNote | null | undefined>();
    const [ type, setType ] = useState<ExtendedNoteType>();

    function refresh() {
        getWidgetType(actualNote, noteContext).then(type => {
            setNote(actualNote);
            setType(type);
        });
    }

    useEffect(refresh, [ actualNote, noteContext]);
    useTriliumEvent("readOnlyTemporarilyDisabled", ({ noteContext: eventNoteContext }) => {
        if (eventNoteContext?.ntxId !== noteContext?.ntxId) return;
        refresh();
    });

    return { note, type, noteContext, parentComponent };
}

function getCorrespondingWidget(noteType: ExtendedNoteType | undefined, props: TypeWidgetProps) {
    switch (noteType) {
        case "empty": return <Empty />
        case "doc": return <Doc {...props} />
        case "search": return <div className="note-detail-none note-detail-printable" />
        case "protectedSession": return <ProtectedSession />
        case "book": return <Book {...props} />
        case "contentWidget": return <ContentWidget {...props} />
        case "webView": return <WebView {...props} />
        case "file": return <File {...props} />
        case "image": return <Image {...props} />
        case "readOnlyCode": return <ReadOnlyCode {...props} />
        case "editableCode": return <EditableCode {...props} />
        case "mermaid": return <Mermaid {...props} />
        case "mindMap": return <MindMap {...props} />
        case "attachmentList": return <AttachmentList {...props} />
        case "attachmentDetail": return <AttachmentDetail {...props} />
        case "readOnlyText": return <ReadOnlyText {...props} />
        default: break;
    }
}

async function getWidgetType(note: FNote | null | undefined, noteContext: NoteContext | undefined): Promise<ExtendedNoteType> {
    if (!note) {
        return "empty";
    }

    const type = note.type;
    let resultingType: ExtendedNoteType;

    if (noteContext?.viewScope?.viewMode === "source") {
        resultingType = "readOnlyCode";
    } else if (noteContext?.viewScope && noteContext.viewScope.viewMode === "attachments") {
        resultingType = noteContext.viewScope.attachmentId ? "attachmentDetail" : "attachmentList";
    } else if (type === "text" && (await noteContext?.isReadOnly())) {
        resultingType = "readOnlyText";
    } else if ((type === "code" || type === "mermaid") && (await noteContext?.isReadOnly())) {
        resultingType = "readOnlyCode";
    } else if (type === "text") {
        resultingType = "editableText";
    } else if (type === "code") {
        resultingType = "editableCode";
    } else if (type === "launcher") {
        resultingType = "doc";
    } else {
        resultingType = type;
    }

    if (note.isProtected && !protected_session_holder.isProtectedSessionAvailable()) {
        resultingType = "protectedSession";
    }

    return resultingType;
}

function checkFullHeight(noteContext: NoteContext | undefined, type: ExtendedNoteType | undefined) {
    if (!noteContext) return false;

    // https://github.com/zadam/trilium/issues/2522
    const isBackendNote = noteContext?.noteId === "_backendLog";
    const isSqlNote = noteContext.note?.mime === "text/x-sqlite;schema=trilium";
    const isFullHeightNoteType = ["canvas", "webView", "noteMap", "mindMap", "mermaid", "file"].includes(type ?? "");
    return (!noteContext?.hasNoteList() && isFullHeightNoteType && !isSqlNote)
        || noteContext?.viewScope?.viewMode === "attachments"
        || isBackendNote;
}
