import NoteContextAwareWidget from "../note_context_aware_widget.js";
import { t } from "../../services/i18n.js";
import type FNote from "../../entities/fnote.js";
import type BasicWidget from "../basic_widget.js";


export default class FloatingButtons extends NoteContextAwareWidget {

    private $children!: JQuery<HTMLElement>;

    async refreshWithNote(note: FNote) {
        this.toggle(true);
        this.$widget.find(".show-floating-buttons-button").on("click", () => this.toggle(true));
    }

    toggle(show: boolean) {
        this.$widget.find(".floating-buttons-children").toggleClass("temporarily-hidden", !show);
    }

    hideFloatingButtonsCommand() {
        this.toggle(false);
    }
}
