import { t } from "../../../../services/i18n.js";
import utils from "../../../../services/utils.js";
import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <h4>${t("editor.title")}</h4>
    
    <div class="form-group row">
        <div class="col-6">
            <label>${t("editing.editor_type.label")}</label>
            <select class="editor-type-select form-select">
                <option value="ckeditor-balloon">${t("editing.editor_type.floating")}</option>
                <option value="ckeditor-classic">${t("editing.editor_type.fixed")}</option>
            </select>
        </div>
    </div>
</div>`;

export default class EditorOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$body = $("body");
        this.$editorType = this.$widget.find(".editor-type-select");
        this.$editorType.on('change', async () => {
            const newEditorType = this.$editorType.val();
            await this.updateOption('textNoteEditorType', newEditorType);
            utils.reloadFrontendApp("editor type change");
        });
    }

    async optionsLoaded(options) {
        this.$editorType.val(options.textNoteEditorType);
    }
}
