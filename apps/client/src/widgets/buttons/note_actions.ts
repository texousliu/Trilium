import NoteContextAwareWidget from "../note_context_aware_widget.js";
import utils from "../../services/utils.js";
import branchService from "../../services/branches.js";
import dialogService from "../../services/dialog.js";
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import ws from "../../services/ws.js";
import appContext, { type EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import type FNote from "../../entities/fnote.js";
import type { FAttachmentRow } from "../../entities/fattachment.js";

const TPL = /*html*/`
<div class="dropdown note-actions">
    <style>
        .note-actions {
            width: 35px;
            height: 35px;
        }

        .note-actions .dropdown-menu {
            min-width: 15em;
        }

        .note-actions .dropdown-item .bx {
            position: relative;
            top: 3px;
            font-size: 120%;
            margin-right: 5px;
        }

        .note-actions .dropdown-item[disabled], .note-actions .dropdown-item[disabled]:hover {
            color: var(--muted-text-color) !important;
            background-color: transparent !important;
            pointer-events: none; /* makes it unclickable */
        }

    </style>
</div>`;

export default class NoteActionsWidget extends NoteContextAwareWidget {

    private $convertNoteIntoAttachmentButton!: JQuery<HTMLElement>;
    private $findInTextButton!: JQuery<HTMLElement>;
    private $printActiveNoteButton!: JQuery<HTMLElement>;
    private $exportAsPdfButton!: JQuery<HTMLElement>;
    private $showSourceButton!: JQuery<HTMLElement>;
    private $showAttachmentsButton!: JQuery<HTMLElement>;
    private $renderNoteButton!: JQuery<HTMLElement>;
    private $saveRevisionButton!: JQuery<HTMLElement>;
    private $exportNoteButton!: JQuery<HTMLElement>;
    private $importNoteButton!: JQuery<HTMLElement>;
    private $openNoteExternallyButton!: JQuery<HTMLElement>;
    private $openNoteCustomButton!: JQuery<HTMLElement>;
    private $deleteNoteButton!: JQuery<HTMLElement>;

    isEnabled() {
        return this.note?.type !== "launcher";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.on("show.bs.dropdown", () => {
            if (this.note) {
                this.refreshVisibility(this.note);
            }
        });

        this.$convertNoteIntoAttachmentButton = this.$widget.find("[data-trigger-command='convertNoteIntoAttachment']");
        this.$findInTextButton = this.$widget.find(".find-in-text-button");
        this.$printActiveNoteButton = this.$widget.find(".print-active-note-button");
        this.$exportAsPdfButton = this.$widget.find(".export-as-pdf-button");
        this.$showSourceButton = this.$widget.find(".show-source-button");
        this.$showAttachmentsButton = this.$widget.find(".show-attachments-button");
        this.$renderNoteButton = this.$widget.find(".render-note-button");
        this.$saveRevisionButton = this.$widget.find(".save-revision-button");

        this.$widget.on("click", ".dropdown-item", () => this.$widget.find("[data-bs-toggle='dropdown']").dropdown("toggle"));

        this.$openNoteExternallyButton = this.$widget.find(".open-note-externally-button");
        this.$openNoteCustomButton = this.$widget.find(".open-note-custom-button");
    }

    async refreshVisibility(note: FNote) {
        this.$convertNoteIntoAttachmentButton.toggle(note.isEligibleForConversionToAttachment());

        this.toggleDisabled(this.$showAttachmentsButton, !isInOptions);
        this.toggleDisabled(this.$showSourceButton, ["text", "code", "relationMap", "mermaid", "canvas", "mindMap"].includes(note.type));


        this.toggleDisabled(this.$printActiveNoteButton, canPrint);
        this.toggleDisabled(this.$exportAsPdfButton, canPrint);
        this.$exportAsPdfButton.toggleClass("hidden-ext", !utils.isElectron());

        this.toggleDisabled(this.$openNoteExternallyButton, utils.isElectron() && !["search", "book"].includes(note.type));
        this.toggleDisabled(
            this.$openNoteCustomButton,
            utils.isElectron() &&
                !utils.isMac() && // no implementation for Mac yet
                !["search", "book"].includes(note.type)
        );

        // I don't want to handle all special notes like this, but intuitively user might want to export content of backend log
        this.toggleDisabled(this.$exportNoteButton, !["_backendLog"].includes(note.noteId) && !isInOptions);

        this.toggleDisabled(this.$importNoteButton, !["search"].includes(note.type) && !isInOptions);
        this.toggleDisabled(this.$deleteNoteButton, !isInOptions);
        this.toggleDisabled(this.$saveRevisionButton, !isInOptions);
    }

    toggleDisabled($el: JQuery<HTMLElement>, enable: boolean) {
        if (enable) {
            $el.removeAttr("disabled");
        } else {
            $el.attr("disabled", "disabled");
        }
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isNoteReloaded(this.noteId)) {
            this.refresh();
        }
    }
}
