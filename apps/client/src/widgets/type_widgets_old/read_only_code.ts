import type { EventData } from "../../components/app_context.js";
import type FNote from "../../entities/fnote.js";
import AbstractCodeTypeWidget from "./abstract_code_type_widget.js";
import utils from "../../services/utils.js";

const TPL = /*html*/`
`;

export default class ReadOnlyCodeTypeWidget extends AbstractCodeTypeWidget {

    async doRefresh(note: FNote) {
        const blob = await this.note?.getBlob();
        if (!blob) return;

        this._update(note, content);
        this.show();
    }

    async executeWithContentElementEvent({ resolve, ntxId }: EventData<"executeWithContentElement">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        resolve(this.$editor);
    }
}
