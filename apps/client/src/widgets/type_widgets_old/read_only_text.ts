import AbstractTextTypeWidget from "./abstract_text_type_widget.js";
import { formatCodeBlocks } from "../../services/syntax_highlight.js";
import type FNote from "../../entities/fnote.js";
import type { CommandListenerData, EventData } from "../../components/app_context.js";
import appContext from "../../components/app_context.js";

export default class ReadOnlyTextTypeWidget extends AbstractTextTypeWidget {

    private $content!: JQuery<HTMLElement>;

    static getType() {
        return "readOnlyText";
    }

    doRender() {
        this.$content = this.$widget.find(".note-detail-readonly-text-content");

        this.setupImageOpening(true);

        super.doRender();
    }

    cleanup() {
        this.$content.html("");
    }

    async doRefresh(note: FNote) {
        await formatCodeBlocks(this.$content);
    }

    async executeWithContentElementEvent({ resolve, ntxId }: EventData<"executeWithContentElement">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        await this.initialized;

        resolve(this.$content);
    }

    buildTouchBarCommand({ TouchBar, buildIcon }: CommandListenerData<"buildTouchBar">) {
        return [
            new TouchBar.TouchBarSpacer({ size: "flexible" }),
            new TouchBar.TouchBarButton({
                icon: buildIcon("NSLockUnlockedTemplate"),
                click: () => {
                    if (this.noteContext?.viewScope) {
                        this.noteContext.viewScope.readOnlyTemporarilyDisabled = true;
                        appContext.triggerEvent("readOnlyTemporarilyDisabled", { noteContext: this.noteContext });
                    }
                    this.refresh();
                }
            })
        ];
    }

}
