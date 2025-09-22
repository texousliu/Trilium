import dialog from "../../../services/dialog";
import toast from "../../../services/toast";
import { isMobile } from "../../../services/utils";
import { useNoteLabel, useTriliumOption } from "../../react/hooks";
import { TypeWidgetProps } from "../type_widget";
import CKEditorWithWatchdog from "./CKEditorWithWatchdog";
import "./EditableText.css";
import type { EditorWatchdog } from "@triliumnext/ckeditor5";

/**
 * The editor can operate into two distinct modes:
 *
 * - Ballon block mode, in which there is a floating toolbar for the selected text, but another floating button for the entire block (i.e. paragraph).
 * - Decoupled mode, in which the editing toolbar is actually added on the client side (in {@link ClassicEditorToolbar}), see https://ckeditor.com/docs/ckeditor5/latest/examples/framework/bottom-toolbar-editor.html for an example on how the decoupled editor works.
 */
export default function EditableText({ note }: TypeWidgetProps) {
    const [ language ] = useNoteLabel(note, "language");
    const [ textNoteEditorType ] = useTriliumOption("textNoteEditorType");
    const isClassicEditor = isMobile() || textNoteEditorType === "ckeditor-classic";

    return (
        <div class="note-detail-editable-text note-detail-printable">
            <CKEditorWithWatchdog
                className="note-detail-editable-text-editor use-tn-links" tabIndex={300}
                isClassicEditor={isClassicEditor}
                watchdogConfig={{
                    // An average number of milliseconds between the last editor errors (defaults to 5000). When the period of time between errors is lower than that and the crashNumberLimit is also reached, the watchdog changes its state to crashedPermanently, and it stops restarting the editor. This prevents an infinite restart loop.
                    minimumNonErrorTimePeriod: 5000,
                    // A threshold specifying the number of errors (defaults to 3). After this limit is reached and the time between last errors is shorter than minimumNonErrorTimePeriod, the watchdog changes its state to crashedPermanently, and it stops restarting the editor. This prevents an infinite restart loop.
                    crashNumberLimit: 10,
                    // A minimum number of milliseconds between saving the editor data internally (defaults to 5000). Note that for large documents, this might impact the editor performance.
                    saveInterval: 5000
                }}
                buildEditorOpts={{
                    contentLanguage: language ?? null,
                    forceGplLicense: false,
                }}
                onNotificationWarning={onNotificationWarning}
                onWatchdogStateChange={onWatchdogStateChange}
            />
        </div>
    )
}

function onWatchdogStateChange(watchdog: EditorWatchdog) {
    const currentState = watchdog.state;
    logInfo(`CKEditor state changed to ${currentState}`);

    if (!["crashed", "crashedPermanently"].includes(currentState)) {
        return;
    }

    logError(`CKEditor crash logs: ${JSON.stringify(watchdog.crashes, null, 4)}`);

    if (currentState === "crashedPermanently") {
        dialog.info(`Editing component keeps crashing. Please try restarting Trilium. If problem persists, consider creating a bug report.`);
        watchdog.editor?.enableReadOnlyMode("crashed-editor");
    }
}

function onNotificationWarning(data, evt) {
    const title = data.title;
    const message = data.message.message;

    if (title && message) {
        toast.showErrorTitleAndMessage(data.title, data.message.message);
    } else if (title) {
        toast.showError(title || message);
    }

    evt.stop();
}
