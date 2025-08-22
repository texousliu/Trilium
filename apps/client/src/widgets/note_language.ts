import { Dropdown } from "bootstrap";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import { getAvailableLocales, getLocaleById, t } from "../services/i18n.js";
import type { EventData } from "../components/app_context.js";
import type FNote from "../entities/fnote.js";
import attributes from "../services/attributes.js";
import type { Locale } from "@triliumnext/commons";
import options from "../services/options.js";
import appContext from "../components/app_context.js";

const TPL = /*html*/`\
<div class="dropdown note-language-widget">
    <button type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-sm dropdown-toggle select-button note-language-button">
        <span class="note-language-desc"></span>
        <span class="caret"></span>
    </button>
    <div class="note-language-dropdown dropdown-menu dropdown-menu-left tn-dropdown-list"></div>
    <button class="language-help-button icon-action bx bx-help-circle" type="button" data-in-app-help="B0lcI9xz1r8K" title="${t("open-help-page")}"></button>

    <style>
        .note-language-widget {
            display: flex;
            align-items: center;
        }

        .language-help-button {
            margin-left: 4px;
        }

        .note-language-dropdown [dir=rtl] {
            text-align: right;
        }

        .dropdown-item.rtl > .check {
            order: 1;
        }
    </style>
</div>
`;

export default class NoteLanguageWidget extends NoteContextAwareWidget {

    private dropdown!: Dropdown;
    private $noteLanguageDropdown!: JQuery<HTMLElement>;
    private $noteLanguageDesc!: JQuery<HTMLElement>;
    private locales: (Locale | "---")[];
    private currentLanguageId?: string;

    constructor() {
        super();
        this.locales = NoteLanguageWidget.#buildLocales();
    }

    doRender() {
        this.$widget = $(TPL);
        this.dropdown = Dropdown.getOrCreateInstance(this.$widget.find("[data-bs-toggle='dropdown']")[0]);

        this.$noteLanguageDropdown = this.$widget.find(".note-language-dropdown")
        this.$noteLanguageDesc = this.$widget.find(".note-language-desc");
    }

    renderDropdown() {
        this.$noteLanguageDropdown.empty();

        if (!this.note) {
            return;
        }

        const $configureLink = $('<a class="dropdown-item">')
            .on("click", () => ));
        this.$noteLanguageDropdown.append($configureLink);
    }

    async save(languageId: string) {
        if (!this.note) {
            return;
        }

        attributes.setAttribute(this.note, "label", "language", languageId);
    }

    async refreshWithNote(note: FNote) {
        const language = getLocaleById(currentLanguageId) ?? DEFAULT_LOCALE;
        this.currentLanguageId = currentLanguageId;
        this.$noteLanguageDesc.text(language.name);
        this.dropdown.hide();
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("languages")) {
            this.locales = NoteLanguageWidget.#buildLocales();
        }

        if (loadResults.getAttributeRows().find((a) => a.noteId === this.noteId && a.name === "language")) {
            this.refresh();
        }
    }

    static #buildLocales() {

    }

}
