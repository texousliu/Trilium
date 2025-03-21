import type FNote from "../../entities/fnote.js";
import utils from "../../services/utils.js";
import EditableCodeTypeWidget from "./editable_code.js";
import TypeWidget from "./type_widget.js";
import Split from "split.js";
import { DEFAULT_GUTTER_SIZE } from "../../services/resizer.js";

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

        .note-detail-split .note-detail-split-editor {
            width: 100%;
        }

        /* Horizontal layout */

        .note-detail-split.split-horizontal > .note-detail-split-editor {
            border-left: 1px solid var(--main-border-color);
        }

        .note-detail-split.split-horizontal > div {
            height: 100%;
            width: 50%;
        }

        /* Vertical layout */


    </style>
</div>
`;

/**
 * Abstract `TypeWidget` which contains a preview and editor pane, each displayed on half of the available screen.
 *
 * Features:
 *
 * - The two panes are resizeable via a split, on desktop.
 */
export default class SplitTypeEditor extends TypeWidget {

    private splitInstance?: Split.Instance;

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
        this.#setupResizer();

        super.doRender();
    }

    cleanup(): void {
        this.splitInstance?.destroy();
        this.splitInstance = undefined;
    }

    async doRefresh(note: FNote | null | undefined) {
        await this.editorTypeWidget.initialized;

        if (note) {
            this.editorTypeWidget.noteContext = this.noteContext;
            this.editorTypeWidget.spacedUpdate = this.spacedUpdate;
            this.editorTypeWidget.doRefresh(note);
        }
    }

    #setupResizer() {
        if (!utils.isDesktop()) {
            return;
        }

        this.splitInstance?.destroy();
        this.splitInstance = Split([ this.$preview[0], this.$editor[0] ], {
            sizes: [ 50, 50 ],
            direction: "horizontal",
            gutterSize: DEFAULT_GUTTER_SIZE,
            // onDragEnd: () => this.zoomHandler?.()
        });
    }

    getData() {
        return this.editorTypeWidget.getData();
    }
}
