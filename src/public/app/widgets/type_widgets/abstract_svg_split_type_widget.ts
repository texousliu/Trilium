import type FNote from "../../entities/fnote.js";
import AbstractSplitTypeWidget from "./abstract_split_type_widget.js";

/**
 * A specialization of `SplitTypeWidget` meant for note types that have a SVG preview.
 *
 * This adds the following functionality:
 *
 * - Automatic handling of the preview when content or the note changes.
 * - Built-in pan and zoom functionality with automatic re-centering.
 *
 */
export default abstract class AbstractSvgSplitTypeWidget extends AbstractSplitTypeWidget {

    private $renderContainer!: JQuery<HTMLElement>;
    private zoomHandler: () => void;
    private zoomInstance?: SvgPanZoom.Instance;

    constructor() {
        super();
        this.zoomHandler = () => {
            if (this.zoomInstance) {
                this.zoomInstance.resize();
                this.zoomInstance.fit();
                this.zoomInstance.center();
            }
        }
    }

    doRender(): void {
        super.doRender();
        this.$renderContainer = $(`<div>`)
            .addClass("render-container")
            .css("height", "100%");
        this.$preview.append(this.$renderContainer);
        $(window).on("resize", this.zoomHandler);
    }

    async doRefresh(note: FNote | null | undefined) {
        super.doRefresh(note);

        const blob = await note?.getBlob();
        const content = blob?.content || "";
        this.refreshPreview(content, true);
    }

    getData(): { content: string; } {
        const data = super.getData();
        this.refreshPreview(data.content, false);
        return data;
    }

    /**
     * Triggers an update of the preview pane with the provided content.
     *
     * @param content the content that will be passed to `renderSvg` for rendering. It is not the SVG content.
     * @param recenter `true` to reposition the pan/zoom to fit the image and to center it.
     */
    async refreshPreview(content: string, recenter: boolean) {
        if (this.note) {
            const svg = await this.renderSvg(content);
            this.$renderContainer.html(svg);
            await this.#setupPanZoom(!recenter);
        }
    }

    cleanup(): void {
        this.#cleanUpZoom();
        $(window).off("resize", this.zoomHandler);
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

    /**
     * @param preservePanZoom `true` to keep the pan/zoom settings of the previous image, or `false` to re-center it.
     */
    async #setupPanZoom(preservePanZoom: boolean) {
        // Clean up
        let pan = null;
        let zoom = null;
        if (preservePanZoom && this.zoomInstance) {
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

        if (preservePanZoom && pan && zoom) {
            // Restore the pan and zoom.
            zoomInstance.zoom(zoom);
            zoomInstance.pan(pan);
        } else {
            // New instance, reposition properly.
            zoomInstance.center();
            zoomInstance.fit();
        }

        this.zoomInstance = zoomInstance;
    }

    buildSplitExtraOptions(): Split.Options {
        return {
            onDrag: () => this.zoomHandler?.()
        }
    }

    #cleanUpZoom() {
        if (this.zoomInstance) {
            this.zoomInstance.destroy();
            this.zoomInstance = undefined;
        }
    }

}
