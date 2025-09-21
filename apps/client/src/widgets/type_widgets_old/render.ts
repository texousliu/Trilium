import renderService from "../../services/render.js";
import TypeWidget from "./type_widget.js";
import type FNote from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";


export default class RenderTypeWidget extends TypeWidget {

    private $noteDetailRenderHelp!: JQuery<HTMLElement>;
    private $noteDetailRenderContent!: JQuery<HTMLElement>;

    static getType() {
        return "render";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$noteDetailRenderHelp = this.$widget.find(".note-detail-render-help");
        this.$noteDetailRenderContent = this.$widget.find(".note-detail-render-content");

        super.doRender();
    }

    async doRefresh(note: FNote) {
        this.$widget.show();
        this.$noteDetailRenderHelp.hide();

        const renderNotesFound = await renderService.render(note, this.$noteDetailRenderContent);
    }

    cleanup() {
        this.$noteDetailRenderContent.empty();
    }

    renderActiveNoteEvent() {
        if (this.noteContext?.isActive()) {
            this.refresh();
        }
    }

    async executeWithContentElementEvent({ resolve, ntxId }: EventData<"executeWithContentElement">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        resolve(this.$noteDetailRenderContent);
    }
}
