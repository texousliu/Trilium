import type { EventData } from "../../components/app_context.js";
import options from "../../services/options.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = `
<button type="button"
    class="switch-layout-button"
    title="Switch layout">
    <span class="bx"></span>
</button>
`;

export default class SwitchSplitOrientationButton extends NoteContextAwareWidget {
    isEnabled() {
        return super.isEnabled()
            && ["mermaid"].includes(this.note?.type ?? "")
            && this.note?.isContentAvailable()
            && this.noteContext?.viewScope?.viewMode === "default";
    }

    doRender(): void {
        super.doRender();
        this.$widget = $(TPL);
        this.$widget.on("click", () => {
            const currentOrientation = options.get("splitEditorOrientation");
            options.save("splitEditorOrientation", toggleOrientation(currentOrientation));
        });
        this.#adjustIcon();
        this.contentSized();
    }

    #adjustIcon() {
        const currentOrientation = options.get("splitEditorOrientation");
        const upcomingOrientation = toggleOrientation(currentOrientation);
        const $icon = this.$widget.find("span.bx");
        $icon
            .toggleClass("bxs-dock-bottom", upcomingOrientation === "vertical")
            .toggleClass("bxs-dock-left", upcomingOrientation === "horizontal");
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("splitEditorOrientation")) {
            this.#adjustIcon();
        }
    }

}

function toggleOrientation(orientation: string) {
    if (orientation === "horizontal") {
        return "vertical";
    } else {
        return "horizontal";
    }
}
