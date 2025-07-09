import { openDialog } from "../../services/dialog.js";
import BasicWidget from "../basic_widget.js";

const TPL = /*html*/`\
<div class="popup-editor-dialog modal fade mx-auto" tabindex="-1" role="dialog">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Popup editor</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body">
                Hi
            </div>
        </div>
    </div>
</div>
`;

export default class PopupEditorDialog extends BasicWidget {

    constructor() {
        super();
        setTimeout(() => {
            this.openPopupEditorEvent("7mLWh47uEPEp");
        }, 750);
    }

    doRender() {
        this.$widget = $(TPL);
    }

    async refresh() {

    }

    async openPopupEditorEvent(noteId: string) {
        await this.refresh();
        openDialog(this.$widget);
    }
}
