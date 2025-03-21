import type FNote from "../../entities/fnote.js";
import AbstractSplitTypeWidget from "./abstract_split_type_widget.js";

/**
 * A specialization of `SplitTypeWidget` meant for note types that have a SVG preview.
 *
 * This adds the following functionality:
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

        if (note) {
            const blob = await note.getBlob();
            const content = blob?.content || "";
            console.log(content);

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
