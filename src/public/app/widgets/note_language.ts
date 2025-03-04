import { Dropdown } from "bootstrap";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import { getAvailableLocales, type Locale } from "../services/i18n.js";

const TPL = `\
<div class="dropdown note-language-widget">
    <button type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" class="btn btn-sm dropdown-toggle select-button note-language-button">
        <span class="note-language-desc"></span>
        <span class="caret"></span>
    </button>
    <div class="note-language-dropdown dropdown-menu dropdown-menu-left tn-dropdown-list"></div>
</div>
`;

export default class NoteLanguageWidget extends NoteContextAwareWidget {

    private dropdown!: Dropdown;
    private $noteLanguageDropdown!: JQuery<HTMLElement>;
    private $noteLanguageButton!: JQuery<HTMLElement>;
    private $noteLanguageDesc!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.dropdown = Dropdown.getOrCreateInstance(this.$widget.find("[data-bs-toggle='dropdown']")[0]);
        this.$widget.on("show.bs.dropdown", () => this.renderDropdown());

        this.$noteLanguageDropdown = this.$widget.find(".note-language-dropdown")
        this.$noteLanguageButton = this.$widget.find(".note-language-button");
        this.$noteLanguageDesc = this.$widget.find(".note-language-desc");
    }

    renderDropdown() {
        this.$noteLanguageDropdown.empty();

        if (!this.note) {
            return;
        }

        for (const locale of getAvailableLocales()) {
            const $title = $("<span>").text(locale.name);
            const $link = $('<a class="dropdown-item">')
                .attr("data-language", locale.id)
                .append('<span class="check">&check;</span> ')
                .append($title);
            this.$noteLanguageDropdown.append($link);
        }
    }

}
