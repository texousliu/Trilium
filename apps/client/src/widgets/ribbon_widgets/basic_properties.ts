import NoteContextAwareWidget from "../note_context_aware_widget.js";
import NoteTypeWidget from "../note_type.js";
import ProtectedNoteSwitchWidget from "../protected_note_switch.js";
import EditabilitySelectWidget from "../editability_select.js";
import BookmarkSwitchWidget from "../bookmark_switch.js";
import SharedSwitchWidget from "../shared_switch.js";
import { t } from "../../services/i18n.js";
import TemplateSwitchWidget from "../template_switch.js";
import type FNote from "../../entities/fnote.js";
import NoteLanguageWidget from "../note_language.js";

const TPL = /*html*/`
    <div class="shared-switch-container"></div>

    <div class="template-switch-container"></div>

    <div class="note-language-container">
        <span>${t("basic_properties.language")}:</span> &nbsp;
    </div>
`;

export default class BasicPropertiesWidget extends NoteContextAwareWidget {

    private sharedSwitchWidget: SharedSwitchWidget;
    private templateSwitchWidget: TemplateSwitchWidget;
    private noteLanguageWidget: NoteLanguageWidget;

    constructor() {
        super();

        this.sharedSwitchWidget = new SharedSwitchWidget().contentSized();
        this.templateSwitchWidget = new TemplateSwitchWidget().contentSized();
        this.noteLanguageWidget = new NoteLanguageWidget().contentSized();

        this.child(
            this.sharedSwitchWidget,
            this.templateSwitchWidget,
            this.noteLanguageWidget);
    }

    get name() {
        return "basicProperties";
    }

    get toggleCommand() {
        return "toggleRibbonBasicProperties";
    }

    getTitle() {
        return {
            show: !this.note?.isLaunchBarConfig(),
        };
    }

    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        this.$widget.find(".note-type-container").append(this.noteTypeWidget.render());
        this.$widget.find(".protected-note-switch-container").append(this.protectedNoteSwitchWidget.render());
        this.$widget.find(".editability-select-container").append(this.editabilitySelectWidget.render());
        this.$widget.find(".bookmark-switch-container").append(this.bookmarkSwitchWidget.render());
        this.$widget.find(".shared-switch-container").append(this.sharedSwitchWidget.render());
        this.$widget.find(".template-switch-container").append(this.templateSwitchWidget.render());
        this.$widget.find(".note-language-container").append(this.noteLanguageWidget.render());
    }

    async refreshWithNote(note: FNote) {
        await super.refreshWithNote(note);
        if (!this.note) {
            return;
        }

        this.$widget.find(".editability-select-container").toggle(this.note && ["text", "code", "mermaid"].includes(this.note.type));
        this.$widget.find(".note-language-container").toggle(this.note && ["text"].includes(this.note.type));
    }
}
