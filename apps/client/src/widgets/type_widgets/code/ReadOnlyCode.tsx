import { useEffect, useState } from "preact/hooks";
import { TypeWidgetProps } from "../type_widget";
import "./code.css";
import CodeMirror from "./CodeMirror";
import utils from "../../../services/utils";
import { useNoteBlob } from "../../react/hooks";

export default function ReadOnlyCode({ note, viewScope }: TypeWidgetProps) {
    const [ content, setContent ] = useState("");
    const blob = useNoteBlob(note);

    useEffect(() => {
        if (!blob) return;
        const isFormattable = note.type === "text" && viewScope?.viewMode === "source";
        setContent(isFormattable ? utils.formatHtml(blob.content) : blob.content);
    }, [ blob ]);

    return (
        <div class="note-detail-readonly-code note-detail-printable">
            <CodeMirror
                className="note-detail-readonly-code-content"
                content={content}
                mime={note.mime}
                readOnly
            />
        </div>
    )
}
