import type FNote from "../../entities/fnote.js";
import AbstractSplitTypeWidget from "./abstract_split_type_widget.js";

/**
 * A specialization of `SplitTypeWidget` meant for note types that have a SVG preview.
 *
 * This adds the following functionality:
 *
 * - Automatic handling of the preview when content or the note changes.
 *
 */
export default abstract class AbstractSvgSplitTypeWidget extends AbstractSplitTypeWidget {

    private $renderContainer!: JQuery<HTMLElement>;
    private zoomHandler?: () => void;
    private zoomInstance?: SvgPanZoom.Instance;

    doRender(): void {
        super.doRender();
        this.$renderContainer = $(`<div>`)
            .addClass("render-container")
            .css("height", "100%");
        this.$preview.append(this.$renderContainer);
    }

    async doRefresh(note: FNote | null | undefined) {
        super.doRefresh(note);

        const blob = await note?.getBlob();
        const content = blob?.content || "";
        this.refreshPreview(content);
    }

    getData(): { content: string; } {
        const data = super.getData();
        this.refreshPreview(data.content);
        return data;
    }

    /**
     * Triggers an update of the preview pane with the provided content.
     *
     * @param content the content that will be passed to `renderSvg` for rendering. It is not the SVG content.
     */
    async refreshPreview(content: string) {
        if (this.note) {
            const svg = await this.renderSvg(content);
            this.$renderContainer.html(svg);
            await this.#setupPanZoom();
        }
    }

    cleanup(): void {
        this.#cleanUpZoom();
        super.cleanup();
    }

    /**
     * Called upon when the SVG preview needs refreshing, such as when the editor has switched to a new note or the content has switched.
     *
     * The method must return a valid SVG string that will be automatically displayed in the preview.
     *
     * @param content the content of the note, in plain text.
     */
    abstract renderSvg(content: string): Promise<string>;

    async #setupPanZoom() {
        // Clean up
        let pan = null;
        let zoom = null;
        if (this.zoomInstance) {
            // Store pan and zoom for same note, when the user is editing the note.
            pan = this.zoomInstance.getPan();
            zoom = this.zoomInstance.getZoom();
            this.#cleanUpZoom();
        }

        const $svgEl = this.$renderContainer.find("svg");

        // Fit the image to bounds
        $svgEl.attr("width", "100%")
            .attr("height", "100%")
            .css("max-width", "100%");

        if (!$svgEl.length) {
            return;
        }

        const svgPanZoom = (await import("svg-pan-zoom")).default;
        const zoomInstance = svgPanZoom($svgEl[0], {
            zoomEnabled: true,
            controlIconsEnabled: true
        });

        if (pan && zoom) {
            // Restore the pan and zoom.
            zoomInstance.zoom(zoom);
            zoomInstance.pan(pan);
        } else {
            // New instance, reposition properly.
            zoomInstance.center();
            zoomInstance.fit();
        }

        this.zoomHandler = () => {
            zoomInstance.resize();
            zoomInstance.fit();
            zoomInstance.center();
        };
        this.zoomInstance = zoomInstance;
        $(window).on("resize", this.zoomHandler);
    }

    #cleanUpZoom() {
        if (this.zoomInstance) {
            this.zoomInstance.destroy();
            this.zoomInstance = undefined;
        }
    }

}
