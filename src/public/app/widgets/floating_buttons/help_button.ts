import appContext from "../../components/app_context.js";
import type { NoteType } from "../../entities/fnote.js";
import { t } from "../../services/i18n.js";
import type { ViewScope } from "../../services/link.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";

const TPL = `
<button class="open-contextual-help-button" title="${t("help-button.title")}">
    <span class="bx bx-help-circle"></span>
</button>
`;

const byNoteType: Record<NoteType, string | null> = {
    book: null,
    canvas: null,
    code: null,
    contentWidget: null,
    doc: null,
    file: null,
    geoMap: "foPEtsL51pD2",
    image: null,
    launcher: null,
    mermaid: null,
    mindMap: null,
    noteMap: null,
    relationMap: null,
    render: null,
    search: null,
    text: null,
    webView: null
};

export default class ContextualHelpButton extends NoteContextAwareWidget {

    private helpNoteIdToOpen?: string | null;

    isEnabled() {
        this.helpNoteIdToOpen = null;

        if (!super.isEnabled()) {
            return false;
        }

        if (this.note && byNoteType[this.note.type]) {
            this.helpNoteIdToOpen = byNoteType[this.note.type];
        }

        return !!this.helpNoteIdToOpen;
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.on("click", () => {
            const subContexts = appContext.tabManager.getActiveContext().getSubContexts();
            const targetNote = `_help_${this.helpNoteIdToOpen}`;
            const helpSubcontext = subContexts.find((s) => s.viewScope?.viewMode === "contextual-help");
            const viewScope: ViewScope = {
                viewMode: "contextual-help",
            };
            if (!helpSubcontext) {
                // The help is not already open, open a new split with it.
                const { ntxId } = subContexts[subContexts.length - 1];
                this.triggerCommand("openNewNoteSplit", {
                    ntxId,
                    notePath: targetNote,
                    hoistedNoteId: "_help",
                    viewScope
                })
            } else {
                // There is already a help window open, make sure it opens on the right note.
                helpSubcontext.setNote(targetNote, { viewScope });
            }
        });
    }

}
