import { t } from "../../services/i18n.js";
import server from "../../services/server.js";
import ws from "../../services/ws.js";
import appContext, { type EventData } from "../../components/app_context.js";
import toastService from "../../services/toast.js";
import treeService from "../../services/tree.js";
import NoteContextAwareWidget from "../note_context_aware_widget.js";
import keyboardActionService from "../../services/keyboard_actions.js";
import type FNote from "../../entities/fnote.js";

const TPL = /*html*/`
<div class="code-buttons-widget">
    <style>
        .code-buttons-widget {
            display: flex;
            gap: 10px;
        }
    </style>

    <button class="save-to-note-button floating-button btn" title="${}">
    </button>
</div>`;

export default class CodeButtonsWidget extends NoteContextAwareWidget {

    private $openTriliumApiDocsButton!: JQuery<HTMLElement>;
    private $saveToNoteButton!: JQuery<HTMLElement>;

    isEnabled() {
        return super.isEnabled() && this.note && (this.note.mime.startsWith("application/javascript") || this.note.mime === "text/x-sqlite;schema=trilium");
    }

    doRender() {
        this.$widget = $(TPL);

        this.$executeButton = this.$widget.find(".execute-button");
        this.$saveToNoteButton = this.$widget.find(".save-to-note-button");
        this.$saveToNoteButton.on("click", async () => {

        });

        keyboardActionService.updateDisplayedShortcuts(this.$widget);

        this.contentSized();

        super.doRender();
    }

}
