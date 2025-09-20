import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import { t } from "../../services/i18n.js";
import server from "../../services/server.js";
import toast from "../../services/toast.js";
import utils from "../../services/utils.js";
import OnClickButtonWidget from "../buttons/onclick_button.js";
import AbstractSplitTypeWidget from "./abstract_split_type_widget.js";

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

}
