import { useEffect, useRef, useState } from "preact/hooks";
import { default as VanillaCodeMirror } from "@triliumnext/codemirror";
import { TypeWidgetProps } from "../type_widget";
import "./code.css";
import CodeMirror from "./CodeMirror";
import utils from "../../../services/utils";
import { useEditorSpacedUpdate, useNoteBlob, useTriliumOptionBool } from "../../react/hooks";
import { t } from "../../../services/i18n";
import appContext from "../../../components/app_context";
import TouchBar, { TouchBarButton } from "../../react/TouchBar";
import keyboard_actions from "../../../services/keyboard_actions";
import { refToJQuerySelector } from "../../react/react_utils";

export function ReadOnlyCode({ note, viewScope, ntxId }: TypeWidgetProps) {
    const [ content, setContent ] = useState("");
    const blob = useNoteBlob(note);

    useEffect(() => {
        if (!blob) return;
        const isFormattable = note.type === "text" && viewScope?.viewMode === "source";
        setContent(isFormattable ? utils.formatHtml(blob.content) : blob.content);
    }, [ blob ]);

    return (
        <div className="note-detail-readonly-code note-detail-printable">
            <CodeMirror
                className="note-detail-readonly-code-content"
                content={content}
                mime={note.mime}
                readOnly
                ntxId={ntxId}
            />
        </div>
    )
}

export function EditableCode({ note, ntxId, debounceUpdate, parentComponent }: TypeWidgetProps & {
    // if true, the update will be debounced to prevent excessive updates. Especially useful if the editor is linked to a live preview.
    debounceUpdate?: boolean;
}) {
    const editorRef = useRef<VanillaCodeMirror>(null);
    const containerRef = useRef<HTMLPreElement>(null);
    const [ vimKeymapEnabled ] = useTriliumOptionBool("vimKeymapEnabled");
    const spacedUpdate = useEditorSpacedUpdate({
        note,
        getData: () => ({ content: editorRef.current?.getText() }),
        onContentChange: (content) => {
            const codeEditor = editorRef.current;
            if (!codeEditor) return;
            codeEditor.setText(content ?? "");
            codeEditor.setMimeType(note.mime);
            codeEditor.clearHistory();
        }
    });

    useEffect(() => {
        if (!parentComponent) return;
        keyboard_actions.setupActionsForElement("code-detail", refToJQuerySelector(containerRef), parentComponent);
    }, []);

    return (
        <div className="note-detail-code note-detail-printable">
            <CodeMirror
                editorRef={editorRef} containerRef={containerRef}
                className="note-detail-code-editor"
                ntxId={ntxId}
                placeholder={t("editable_code.placeholder")}
                vimKeybindings={vimKeymapEnabled}
                tabIndex={300}
                onContentChanged={() => {
                    if (debounceUpdate) {
                        spacedUpdate.resetUpdateTimer();
                    }
                    spacedUpdate.scheduleUpdate();
                }}
            />

            <TouchBar>
                {(note?.mime.startsWith("application/javascript") || note?.mime === "text/x-sqlite;schema=trilium") && (
                    <TouchBarButton icon="NSImageNameTouchBarPlayTemplate" click={() => appContext.triggerCommand("runActiveNote")} />
                )}
            </TouchBar>
        </div>
    )
}
