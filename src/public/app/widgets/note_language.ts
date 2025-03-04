import { Dropdown } from "bootstrap";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import { getAvailableLocales, type Locale } from "../services/i18n.js";
import { t } from "i18next";
import type { EventData } from "../components/app_context.js";
import type FNote from "../entities/fnote.js";
import attributes from "../services/attributes.js";

const TPL = `\
<div class="dropdown note-language-widget">
    <button type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-sm dropdown-toggle select-button note-language-button">
        <span class="note-language-desc"></span>
        <span class="caret"></span>
    </button>
    <div class="note-language-dropdown dropdown-menu dropdown-menu-left tn-dropdown-list"></div>
</div>
`;

const DEFAULT_LOCALE: Locale = {
    id: "",
    name: t("note_language.not_set")
};

export default class NoteLanguageWidget extends NoteContextAwareWidget {

    private dropdown!: Dropdown;
    private $noteLanguageDropdown!: JQuery<HTMLElement>;
    private $noteLanguageDesc!: JQuery<HTMLElement>;
    private locales: (Locale | "---")[];

    constructor() {
        super();
        this.locales = [
            DEFAULT_LOCALE,
            "---",
            ...getAvailableLocales()
        ];
    }

    doRender() {
        this.$widget = $(TPL);
        this.dropdown = Dropdown.getOrCreateInstance(this.$widget.find("[data-bs-toggle='dropdown']")[0]);
        this.$widget.on("show.bs.dropdown", () => this.renderDropdown());

        this.$noteLanguageDropdown = this.$widget.find(".note-language-dropdown")
        this.$noteLanguageDesc = this.$widget.find(".note-language-desc");
    }

    renderDropdown() {
        this.$noteLanguageDropdown.empty();

        if (!this.note) {
            return;
        }

        for (const locale of this.locales) {
            if (typeof locale === "object") {
                const $title = $("<span>").text(locale.name);
                const $link = $('<a class="dropdown-item">')
                    .attr("data-language", locale.id)
                    .append('<span class="check">&check;</span> ')
                    .append($title)
                    .on("click", () => {
                        const languageId = $link.attr("data-language") ?? "";
                        this.save(languageId);
                    })
                this.$noteLanguageDropdown.append($link);
            } else {
                this.$noteLanguageDropdown.append('<div class="dropdown-divider"></div>');
            }
        }
    }

    async save(languageId: string) {
        if (!this.note) {
            return;
        }

        attributes.setAttribute(this.note, "label", "language", languageId);
    }

    async refreshWithNote(note: FNote) {
        const languageId = note.getLabelValue("language") ?? "";
        const language = (this.locales.find((l) => (typeof l === "object" && l.id === languageId)) as Locale | null) ?? DEFAULT_LOCALE;
        this.$noteLanguageDesc.text(language.name);
        this.dropdown.hide();
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows().find((a) => a.noteId === this.noteId && a.name === "language")) {
            this.refresh();
        }
    }

}
