import type FNote from "../../entities/fnote.js";
import EditableCodeTypeWidget from "./editable_code.js";
import TypeWidget from "./type_widget.js";

const TPL = `\
<div class="note-detail-split note-detail-printable split-horizontal">
    <div class="note-detail-split-preview">
        Preview goes here.
    </div>

    <div class="note-detail-split-editor">
    </div>

    <style>
        .note-detail-split {
            display: flex;
            height: 100%;
        }

        .note-detail-split.split-horizontal > div {
            height: 100%;
            width: 50%;
        }

        .note-detail-split .note-detail-split-editor {
            width: 100%;
        }

    </style>
</div>
`;

export default class SplitTypeEditor extends TypeWidget {

    private $preview!: JQuery<HTMLElement>;
    private $editor!: JQuery<HTMLElement>;
    private editorTypeWidget: EditableCodeTypeWidget;

    constructor() {
        super();
        this.editorTypeWidget = new EditableCodeTypeWidget();
        this.editorTypeWidget.isEnabled = () => true;
    }

    doRender(): void {
        this.$widget = $(TPL);

        this.$preview = this.$widget.find(".note-detail-split-preview");
        this.$editor = this.$widget.find(".note-detail-split-editor");
        this.$editor.append(this.editorTypeWidget.render());

        super.doRender();
    }

    async doRefresh(note: FNote | null | undefined) {
        await this.editorTypeWidget.initialized;

        if (note) {
            this.editorTypeWidget.noteContext = this.noteContext;
            this.editorTypeWidget.spacedUpdate = this.spacedUpdate;
            this.editorTypeWidget.doRefresh(note);
        }
    }

    getData() {
        return this.editorTypeWidget.getData();
    }
}
