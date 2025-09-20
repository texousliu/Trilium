import { isMobile } from "../../../services/utils";
import Admonition from "../../react/Admonition";
import { useNoteLabelBoolean, useTriliumOption } from "../../react/hooks";
import { TypeWidgetProps } from "../type_widget";
import "./SplitEditor.css";

interface SplitEditorProps extends TypeWidgetProps {
    error?: string | null;
}

/**
 * Abstract `TypeWidget` which contains a preview and editor pane, each displayed on half of the available screen.
 *
 * Features:
 *
 * - The two panes are resizeable via a split, on desktop. The split can be optionally customized via {@link buildSplitExtraOptions}.
 * - Can display errors to the user via {@link setError}.
 * - Horizontal or vertical orientation for the editor/preview split, adjustable via the switch split orientation button floating button.
 */
export default function SplitEditor({ note, error }: SplitEditorProps) {
    const splitEditorOrientation = useSplitOrientation();
    const [ readOnly ] = useNoteLabelBoolean(note, "readOnly");

    const editor = (!readOnly &&
        <div className="note-detail-split-editor-col">
            <div className="note-detail-split-editor">Detail goes here.</div>
            {error && <Admonition type="caution" className="note-detail-error-container">
                {error}
            </Admonition>}
        </div>
    );

    const preview = (
        <div className={`note-detail-split-preview-col ${error ? "on-error" : ""}`}>
            <div className="note-detail-split-preview">Preview goes here</div>
            <div className="btn-group btn-group-sm map-type-switcher content-floating-buttons preview-buttons bottom-right" role="group">Buttons go here</div>
        </div>
    );

    return (
        <div className={`note-detail-split note-detail-printable ${"split-" + splitEditorOrientation} ${readOnly ? "split-read-only" : ""}`}>
            {splitEditorOrientation === "horizontal"
            ? <>{editor}{preview}</>
            : <>{preview}{editor}</>}
        </div>
    )
}

function useSplitOrientation() {
    const [ splitEditorOrientation ] = useTriliumOption("splitEditorOrientation");
    if (isMobile()) return "vertical";
    if (!splitEditorOrientation) return "horizontal";
    return splitEditorOrientation;
}
