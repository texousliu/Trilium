import TypeWidget from "./type_widget.js";
import utils from "../../services/utils.js";
import type { MindElixirInstance } from "mind-elixir";
import type FNote from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";

export default class MindMapWidget extends TypeWidget {

    private $content!: JQuery<HTMLElement>;
    private triggeredByUserOperation?: boolean;
    private mind?: MindElixirInstance;
    private MindElixir: any; // TODO: Fix type

    static getType() {
        return "mindMap";
    }

    async doRefresh(note: FNote) {
        if (this.triggeredByUserOperation) {
            this.triggeredByUserOperation = false;
            return;
        }

        await this.#loadData(note);
    }

    cleanup() {
        this.triggeredByUserOperation = false;
    }

    async #loadData(note: FNote) {
        const blob = await note.getBlob();
        const content = blob?.getJsonContent<MindmapModel>();

        if (!this.mind) {
            await this.#initLibrary(content?.direction);
        }

        this.mind!.refresh(content ?? this.MindElixir.new(NEW_TOPIC_NAME));
        this.mind!.toCenter();
    }

    async #initLibrary(direction?: number) {
        const mind = new this.MindElixir({
            direction: direction ?? this.MindElixir.LEFT
        });

        this.mind = mind;
    }

    async renderSvg() {
        return await this.mind!.exportSvg().text();
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (this.noteId && loadResults.isNoteReloaded(this.noteId)) {
            this.refresh();
        }
    }

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

    async executeWithContentElementEvent({ resolve, ntxId }: EventData<"executeWithContentElement">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        resolve(this.$content.find('.main-node-container'));
    }
}
