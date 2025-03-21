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

    doRender(): void {
        super.doRender();
        this.$renderContainer = $(`<div class="render-container"></div>`);
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
        }
    }

    /**
     * Called upon when the SVG preview needs refreshing, such as when the editor has switched to a new note or the content has switched.
     *
     * The method must return a valid SVG string that will be automatically displayed in the preview.
     *
     * @param content the content of the note, in plain text.
     */
    abstract renderSvg(content: string): Promise<string>;

}
