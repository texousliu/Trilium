import AbstractTextTypeWidget from "./abstract_text_type_widget.js";
import { formatCodeBlocks } from "../../services/syntax_highlight.js";
import type FNote from "../../entities/fnote.js";
import type { CommandListenerData, EventData } from "../../components/app_context.js";
import appContext from "../../components/app_context.js";

export default class ReadOnlyTextTypeWidget extends AbstractTextTypeWidget {
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
