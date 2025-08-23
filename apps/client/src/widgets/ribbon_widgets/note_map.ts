import NoteContextAwareWidget from "../note_context_aware_widget.js";
import NoteMapWidget from "../note_map.js";
import { t } from "../../services/i18n.js";

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

        new ResizeObserver(handleResize).observe(this.$widget[0]);
    }

}
