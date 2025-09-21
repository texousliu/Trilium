import TypeWidget from "./type_widget.js";
import utils from "../../services/utils.js";
import type { MindElixirInstance } from "mind-elixir";
import type FNote from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";

export default class MindMapWidget extends TypeWidget {

    async exportSvgEvent({ ntxId }: EventData<"exportSvg">) {
        if (!this.isNoteContext(ntxId) || this.note?.type !== "mindMap") {
            return;
        }

        const svg = await this.renderSvg();
        utils.downloadSvg(this.note.title, svg);
    }

    async exportPngEvent({ ntxId }: EventData<"exportPng">) {
        if (!this.isNoteContext(ntxId) || this.note?.type !== "mindMap") {
            return;
        }

        const svg = await this.renderSvg();
        utils.downloadSvgAsPng(this.note.title, svg);
    }

}
