import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import EditableCodeTypeWidget from "./editable_code.js";
import TypeWidget from "./type_widget.js";

const TPL = `\
<div class="note-detail-split-editor note-detail-printable">
    <div class="note-detail-split-preview">
    </div>

    <div class="note-detail-split-editor">
    </div>
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
        console.log("Render");
        this.$widget = $(TPL);

        this.$preview = this.$widget.find(".note-detail-split-preview");
        this.$editor = this.$widget.find(".note-detail-split-editor");
        this.$editor.append(this.editorTypeWidget.render());

        super.doRender();
    }

    async doRefresh(note: FNote | null | undefined) {
        await this.editorTypeWidget.initialized;

        if (note) {
            console.log("Refresh with ", note);
            this.editorTypeWidget.noteContext = this.noteContext;
            this.editorTypeWidget.spacedUpdate = this.spacedUpdate;
            this.editorTypeWidget.doRefresh(note);
        }
    }

    getData() {
        return this.editorTypeWidget.getData();
    }
}
