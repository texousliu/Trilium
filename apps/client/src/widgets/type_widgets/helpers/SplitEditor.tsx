import { TypeWidgetProps } from "../type_widget";
import "./SplitEditor.css";

/**
 * Abstract `TypeWidget` which contains a preview and editor pane, each displayed on half of the available screen.
 *
 * Features:
 *
 * - The two panes are resizeable via a split, on desktop. The split can be optionally customized via {@link buildSplitExtraOptions}.
 * - Can display errors to the user via {@link setError}.
 * - Horizontal or vertical orientation for the editor/preview split, adjustable via the switch split orientation button floating button.
 */
export default function SplitEditor({ }: TypeWidgetProps) {
    return (
        <div className="note-detail-split note-detail-printable">
            <div className="note-detail-split-editor-col">
                <div className="note-detail-split-editor"></div>
                <div className="admonition caution note-detail-error-container hidden-ext"></div>
            </div>
            <div className="note-detail-split-preview-col">
                <div className="note-detail-split-preview"></div>
                <div className="btn-group btn-group-sm map-type-switcher content-floating-buttons preview-buttons bottom-right" role="group"></div>
            </div>
        </div>
    )
}
