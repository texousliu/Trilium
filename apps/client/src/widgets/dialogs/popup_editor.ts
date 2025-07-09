import NoteContext from "../../components/note_context.js";
import { openDialog } from "../../services/dialog.js";
import froca from "../../services/froca.js";
import BasicWidget from "../basic_widget.js";
import Container from "../containers/container.js";

const TPL = /*html*/`\
<div class="popup-editor-dialog modal fade mx-auto" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Popup editor</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body">
                <!-- This is where the content will be injected. -->
            </div>
        </div>
    </div>
</div>
`;

export default class PopupEditorDialog extends Container<BasicWidget> {

    private noteId?: string;

    constructor() {
        super();
        setTimeout(() => {
            this.openPopupEditorEvent("vdJ8utb0A0Kd");
        }, 750);
    }

    doRender() {
        // This will populate this.$widget with the content of the children.
        super.doRender();

        // Now we wrap it in the modal.
        const $newWidget = $(TPL);
        $newWidget.find(".modal-body").append(this.$widget.children());
        this.$widget = $newWidget;
    }

    async refresh() {
        if (!this.noteId) {
            console.warn("Popup editor noteId is not set, cannot refresh.");
            return false;
        }

        const note = await froca.getNote(this.noteId);
        if (!note) {
            console.warn(`Popup editor note with ID ${this.noteId} not found.`);
            return false;
        }

        const noteContext = new NoteContext("_popup-editor");
        await noteContext.setNote(note.noteId);

        await this.handleEventInChildren("setNoteContext", {
            noteContext: noteContext
        });
        return true;
    }

    async openPopupEditorEvent(noteId: string) {
        this.noteId = noteId;
        if (await this.refresh()) {
            openDialog(this.$widget);
        }
    }
}
