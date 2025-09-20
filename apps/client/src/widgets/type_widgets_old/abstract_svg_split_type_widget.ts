import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import { t } from "../../services/i18n.js";
import server from "../../services/server.js";
import toast from "../../services/toast.js";
import utils from "../../services/utils.js";
import OnClickButtonWidget from "../buttons/onclick_button.js";
import AbstractSplitTypeWidget from "./abstract_split_type_widget.js";

/**
 * A specialization of `SplitTypeWidget` meant for note types that have a SVG preview.
 *
 * This adds the following functionality:
 *
 * - Automatic handling of the preview when content or the note changes via {@link renderSvg}.
 * - Built-in pan and zoom functionality with automatic re-centering.
 * - Automatically displays errors to the user if {@link renderSvg} failed.
 * - Automatically saves the SVG attachment.
 *
 */
export default abstract class AbstractSvgSplitTypeWidget extends AbstractSplitTypeWidget {

    private $renderContainer!: JQuery<HTMLElement>;
    private zoomHandler: () => void;
    private zoomInstance?: SvgPanZoom.Instance;
    private svg?: string;


    doRender(): void {
        super.doRender();
        this.$preview.append(this.$renderContainer);
        $(window).on("resize", this.zoomHandler);
    }

    async doRefresh(note: FNote) {
        super.doRefresh(note);

        const blob = await note?.getBlob();
        const content = blob?.content || "";
        this.onContentChanged(content, true);

        // Save the SVG when entering a note only when it does not have an attachment.
        this.note?.getAttachments().then((attachments) => {
            const attachmentName = `${this.attachmentName}.svg`;
            if (!attachments.find((a) => a.title === attachmentName)) {
                this.#saveSvg();
            }
        });
    }
    async exportSvgEvent({ ntxId }: EventData<"exportSvg">) {
        if (!this.isNoteContext(ntxId) || this.note?.type !== "mermaid" || !this.svg) {
            return;
        }

        utils.downloadSvg(this.note.title, this.svg);
    }

    async exportPngEvent({ ntxId }: EventData<"exportPng">) {
        console.log("Export to PNG", this.noteContext?.noteId, ntxId, this.svg);
        if (!this.isNoteContext(ntxId) || this.note?.type !== "mermaid" || !this.svg) {
            console.log("Return");
            return;
        }

        try {
            await utils.downloadSvgAsPng(this.note.title, this.svg);
        } catch (e) {
            console.warn(e);
            toast.showError(t("svg.export_to_png"));
        }
    }

}
