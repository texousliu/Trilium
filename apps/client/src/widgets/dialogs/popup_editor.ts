import { openDialog } from "../../services/dialog.js";
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

    constructor() {
        super();
        setTimeout(() => {
            this.openPopupEditorEvent("7mLWh47uEPEp");
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

    }

    async openPopupEditorEvent(noteId: string) {
        await this.refresh();
        openDialog(this.$widget);
    }
}
