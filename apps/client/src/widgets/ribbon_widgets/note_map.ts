import NoteContextAwareWidget from "../note_context_aware_widget.js";
import NoteMapWidget from "../note_map.js";
import { t } from "../../services/i18n.js";

const TPL = /*html*/`

    <button class="bx bx-arrow-to-bottom icon-action open-full-button" title="${t("note_map.open_full")}"></button>
    <button class="bx bx-arrow-to-top icon-action collapse-button" style="display: none;" title="${t("note_map.collapse")}"></button>


</div>`;

export default class NoteMapRibbonWidget extends NoteContextAwareWidget {

    private openState!: "small" | "full";
    private $container!: JQuery<HTMLElement>;
    private $openFullButton!: JQuery<HTMLElement>;
    private $collapseButton!: JQuery<HTMLElement>;


    doRender() {
        this.$widget = $(TPL);
        this.contentSized();
        this.$container = this.$widget.find(".note-map-container");
        this.$container.append(this.noteMapWidget.render());

        this.openState = "small";

        this.$openFullButton = this.$widget.find(".open-full-button");
        this.$openFullButton.on("click", () => {
            this.setFullHeight();

            this.$openFullButton.hide();
            this.$collapseButton.show();

            this.openState = "full";

            this.noteMapWidget.setDimensions();
        });

        this.$collapseButton = this.$widget.find(".collapse-button");
        this.$collapseButton.on("click", () => {
            this.setSmallSize();

            this.$openFullButton.show();
            this.$collapseButton.hide();

            this.openState = "small";

            this.noteMapWidget.setDimensions();
        });

        const handleResize = () => {
            if (!this.noteMapWidget.graph) {
                // no graph has been even rendered
                return;
            }

            if (this.openState === "full") {
                this.setFullHeight();
            } else if (this.openState === "small") {
                this.setSmallSize();
            }
        };

        new ResizeObserver(handleResize).observe(this.$widget[0]);
    }

    setSmallSize() {
        const SMALL_SIZE_HEIGHT = 300;
        const width = this.$widget.width() ?? 0;

        this.$widget.find(".note-map-container").height(SMALL_SIZE_HEIGHT).width(width);
    }

    setFullHeight() {
        const { top } = this.$widget[0].getBoundingClientRect();

        const height = ($(window).height() ?? 0) - top;
        const width = this.$widget.width() ?? 0;

        this.$widget.find(".note-map-container")
            .height(height)
            .width(width);
    }
}
