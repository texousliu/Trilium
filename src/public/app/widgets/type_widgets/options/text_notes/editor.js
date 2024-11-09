import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <h4>Editor</h4>
    
    <div class="form-group row">
        <div class="col-6">
            <label>Editor type</label>
            <select class="editor-type-select form-select">
                <option value="ckeditor-balloon">CKEditor with floating toolbar (default)</option>
                <option value="ckeditor-classic">CKEditor with fixed toolbar</option>
            </select>
        </div>
    </div>
</div>`;

export default class EditorOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$body = $("body");
        this.$editorType = this.$widget.find(".editor-type-select");
        this.$editorType.on('change', () => {
            const newEditorType = this.$editorType.val();
            this.updateOption('textNoteEditorType', newEditorType);
        });
    }

    async optionsLoaded(options) {
        this.$editorType.val(options.textNoteEditorType);
    }
}
