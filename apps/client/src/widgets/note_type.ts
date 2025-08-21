import { Dropdown } from "bootstrap";
import { NOTE_TYPES } from "../services/note_types.js";
import { t } from "../services/i18n.js";
import dialogService from "../services/dialog.js";
import mimeTypesService from "../services/mime_types.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import server from "../services/server.js";
import type { EventData } from "../components/app_context.js";
import type { NoteType } from "../entities/fnote.js";
import type FNote from "../entities/fnote.js";

const NOT_SELECTABLE_NOTE_TYPES = NOTE_TYPES.filter((nt) => nt.reserved || nt.static).map((nt) => nt.type);

export default class NoteTypeWidget extends NoteContextAwareWidget {

    private dropdown!: Dropdown;
    private $noteTypeDropdown!: JQuery<HTMLElement>;
    private $noteTypeButton!: JQuery<HTMLElement>;
    private $noteTypeDesc!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);

        this.dropdown = Dropdown.getOrCreateInstance(this.$widget.find("[data-bs-toggle='dropdown']")[0]);

        this.$widget.on("show.bs.dropdown", () => this.renderDropdown());

        this.$noteTypeDropdown = this.$widget.find(".note-type-dropdown");
        this.$noteTypeButton = this.$widget.find(".note-type-button");

        this.$widget.on("click", ".dropdown-item", () => this.dropdown.toggle());
    }

    async refreshWithNote(note: FNote) {
        this.$noteTypeButton.prop("disabled", () => NOT_SELECTABLE_NOTE_TYPES.includes(note.type));

        this.$noteTypeDesc.text(await this.findTypeTitle(note.type, note.mime));

        this.dropdown.hide();
    }

}
