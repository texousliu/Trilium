import type FNote from "../../entities/fnote.js";
import utils from "../../services/utils.js";
import EditableCodeTypeWidget from "./editable_code.js";
import TypeWidget from "./type_widget.js";
import Split from "split.js";
import { DEFAULT_GUTTER_SIZE } from "../../services/resizer.js";
import options from "../../services/options.js";
import type SwitchSplitOrientationButton from "../floating_buttons/switch_layout_button.js";
import type { EventData } from "../../components/app_context.js";

const TPL = `\
<div class="note-detail-split note-detail-printable">
    <div class="note-detail-split-first-col">
        <div class="note-detail-split-editor"></div>
        <div class="note-detail-error-container alert alert-warning hidden-ext"></div>
    </div>
    <div class="note-detail-split-second-col">
        <div class="note-detail-split-preview"></div>
    </div>

    <style>
        .note-detail-split {
            display: flex;
            height: 100%;
        }

        .note-detail-split-first-col {
            display: flex;
        }

        .note-detail-split .note-detail-split-editor {
            width: 100%;
            flex-grow: 1;
        }

        .note-detail-split .note-detail-error-container {
            font-family: var(--monospace-font-family);
            margin: 0.1em;
        }

        .note-detail-split .note-detail-split-preview {
            transition: opacity 250ms ease-in-out;
            height: 100%;
        }

        .note-detail-split .note-detail-split-preview.on-error {
            opacity: 0.5;
        }

        /* Horizontal layout */

        .note-detail-split.split-horizontal > .note-detail-split-second-col {
            border-left: 1px solid var(--main-border-color);
        }

        .note-detail-split.split-horizontal > div {
            height: 100%;
            width: 50%;
        }

        .note-detail-split.split-horizontal .note-detail-split-preview {
            height: 100%;
        }

        .note-detail-split.split-horizontal .note-detail-split-first-col {
            flex-direction: column;
        }

        /* Vertical layout */

        .note-detail-split.split-vertical {
            flex-direction: column;
        }

        .note-detail-split.split-vertical > div {
            width: 100%;
            height: 50%;
        }

        .note-detail-split.split-vertical > .note-detail-split-first-col {
            border-top: 1px solid var(--main-border-color);
        }

        .note-detail-split.split-vertical .note-detail-split-second-col {
            order: -1;
        }
    </style>
</div>
`;

/**
 * Abstract `TypeWidget` which contains a preview and editor pane, each displayed on half of the available screen.
 *
 * Features:
 *
 * - The two panes are resizeable via a split, on desktop. The split can be optionally customized via {@link buildSplitExtraOptions}.
 * - Can display errors to the user via {@link setError}.
 * - Horizontal or vertical orientation for the editor/preview split, adjustable via {@link SwitchSplitOrientationButton}.
 */
export default abstract class AbstractSplitTypeWidget extends TypeWidget {

    private splitInstance?: Split.Instance;

    protected $preview!: JQuery<HTMLElement>;
    private $firstCol!: JQuery<HTMLElement>;
    private $secondCol!: JQuery<HTMLElement>;
    private $editor!: JQuery<HTMLElement>;
    private $errorContainer!: JQuery<HTMLElement>;
    private editorTypeWidget: EditableCodeTypeWidget;
    private layoutOrientation?: "horizontal" | "vertical";

    constructor() {
        super();
        this.editorTypeWidget = new EditableCodeTypeWidget();
        this.editorTypeWidget.isEnabled = () => true;
        this.editorTypeWidget.getExtraOpts = this.buildEditorExtraOptions;
    }

    doRender(): void {
        this.$widget = $(TPL);

        this.$firstCol = this.$widget.find(".note-detail-split-first-col");
        this.$secondCol = this.$widget.find(".note-detail-split-second-col");
        this.$preview = this.$widget.find(".note-detail-split-preview");
        this.$editor = this.$widget.find(".note-detail-split-editor");
        this.$editor.append(this.editorTypeWidget.render());
        this.$errorContainer = this.$widget.find(".note-detail-error-container");
        this.#adjustLayoutOrientation();

        super.doRender();
    }

    cleanup(): void {
        this.splitInstance?.destroy();
        this.splitInstance = undefined;
    }

    async doRefresh(note: FNote | null | undefined) {
        this.#adjustLayoutOrientation();

        await this.editorTypeWidget.initialized;

        if (note) {
            this.editorTypeWidget.noteContext = this.noteContext;
            this.editorTypeWidget.spacedUpdate = this.spacedUpdate;
            this.editorTypeWidget.doRefresh(note);
        }
    }

    #adjustLayoutOrientation() {
        const layoutOrientation = options.get("splitEditorOrientation") ?? "horizontal";
        if (this.layoutOrientation === layoutOrientation) {
            return;
        }

        this.$widget.toggleClass("split-horizontal", layoutOrientation === "horizontal");
        this.$widget.toggleClass("split-vertical", layoutOrientation === "vertical");
        this.layoutOrientation = layoutOrientation as ("horizontal" | "vertical");
        this.#setupResizer();
    }

    #setupResizer() {
        if (!utils.isDesktop()) {
            return;
        }

        this.splitInstance?.destroy();
        this.splitInstance = Split([ this.$firstCol[0], this.$secondCol[0] ], {
            sizes: [ 50, 50 ],
            direction: this.layoutOrientation,
            gutterSize: DEFAULT_GUTTER_SIZE,
            ...this.buildSplitExtraOptions()
        });
    }

    /**
     * Called upon when the split between the preview and content pane is initialized. Can be used to add additional listeners if needed.
     */
    buildSplitExtraOptions(): Split.Options {
        return {};
    }

    /**
     * Called upon when the code editor is being initialized. Can be used to add additional options to the editor.
     */
    buildEditorExtraOptions(): Partial<CodeMirrorOpts> {
        return {
            lineWrapping: false
        };
    }

    setError(message: string | null | undefined) {
        this.$errorContainer.toggleClass("hidden-ext", !message);
        this.$preview.toggleClass("on-error", !!message);
        this.$errorContainer.text(message ?? "");
    }

    getData() {
        return this.editorTypeWidget.getData();
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("splitEditorOrientation")) {
            this.refresh();
        }
    }

}
