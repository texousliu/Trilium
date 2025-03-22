import options from "../../services/options.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = `
<button type="button"
    class="switch-layout-button"
    title="Switch layout">
    <span class="bx bxs-dock-bottom"></span>
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
        this.contentSized();
    }
}

function toggleOrientation(orientation: string) {
    if (orientation === "horizontal") {
        return "vertical";
    } else {
        return "horizontal";
    }
}
