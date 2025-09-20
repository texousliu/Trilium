import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { default as VanillaCodeMirror } from "@triliumnext/codemirror";
import { TypeWidgetProps } from "../type_widget";
import "./code.css";
import CodeMirror from "./CodeMirror";
import utils from "../../../services/utils";
import { useEditorSpacedUpdate, useNoteBlob } from "../../react/hooks";

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

export function EditableCode({ note, ntxId }: TypeWidgetProps) {
    const editorRef = useRef<VanillaCodeMirror>(null);
    const blob = useNoteBlob(note);
    const spacedUpdate = useEditorSpacedUpdate({
        note,
        getData: () => ({ content: editorRef.current?.getText() })
    });

    useEffect(() => {
        spacedUpdate.allowUpdateWithoutChange(() => {
            const codeEditor = editorRef.current;
            if (!codeEditor) return;
            codeEditor.setText(blob?.content ?? "");
            codeEditor.setMimeType(note.mime);
            codeEditor.clearHistory();
        });
    }, [ blob ]);

    return (
        <div className="note-detail-code note-detail-printable">
            <CodeMirror
                editorRef={editorRef}
                className="note-detail-code-editor"
                ntxId={ntxId}
                onContentChanged={() => {
                    spacedUpdate.scheduleUpdate();
                }}
            />
        </div>
    )
}
