/**
 * @module
 * Contains the definitions for all the note types supported by the application.
 */

import { NoteType } from "@triliumnext/commons";
import TypeWidget from "./type_widgets_old/type_widget";
import { TypeWidgetProps } from "./type_widgets/type_widget";
import { VNode } from "preact";

/**
 * A `NoteType` altered by the note detail widget, taking into consideration whether the note is editable or not and adding special note types such as an empty one,
 * for protected session or attachment information.
 */
export type ExtendedNoteType = Exclude<NoteType, "launcher" | "text" | "code"> | "empty" | "readOnlyCode" | "readOnlyText" | "editableText" | "editableCode" | "attachmentDetail" | "attachmentList" |  "protectedSession" | "aiChat";

type NoteTypeView = () => Promise<{ default: TypeWidget } | TypeWidget> | ((props: TypeWidgetProps) => VNode);

interface NoteTypeMapping {
    view: NoteTypeView;
}

export const TYPE_MAPPINGS: Record<ExtendedNoteType, NoteTypeMapping> = {
    empty: {
        view: () => import("./type_widgets/Empty"),
    },
    doc: {
        view: () => import("./type_widgets/Doc")
    },
    search: {
        view: () => <div className="note-detail-none note-detail-printable" />
    },
    protectedSession: {
        view: () => import("./type_widgets/ProtectedSession")
    },
    book: {
        view: () => import("./type_widgets/Book")
    },
    contentWidget: {
        view: () => import("./type_widgets/ContentWidget")
    },
    webView: {
        view: () => import("./type_widgets/WebView")
    },
    file: {
        view: () => import("./type_widgets/File")
    },
    image: {
        view: () => import("./type_widgets/Image")
    },
    readOnlyCode: {
        view: async () => (await import("./type_widgets/code/Code")).ReadOnlyCode
    },
    editableCode: {
        view: async () => (await import("./type_widgets/code/Code")).EditableCode
    },
    mermaid: {
        view: () => import("./type_widgets/Mermaid")
    },
    mindMap: {
        view: () => import("./type_widgets/MindMap")
    },
    attachmentList: {
        view: async () => (await import("./type_widgets/Attachment")).AttachmentList
    },
    attachmentDetail: {
        view: async () => (await import("./type_widgets/Attachment")).AttachmentDetail
    },
    readOnlyText: {
        view: () => import("./type_widgets/text/ReadOnlyText")
    },
    editableText: {
        view: () => import("./type_widgets/text/EditableText")
    },
    render: {
        view: () => import("./type_widgets/Render")
    },
    canvas: {
        view: () => import("./type_widgets/Canvas")
    },
    relationMap: {
        view: () => import("./type_widgets/relation_map/RelationMap")
    },
    noteMap: {
        view: () => import("./type_widgets/NoteMap")
    },
    aiChat: {
        view: () => import("./type_widgets/AiChat")
    }
};
