import { t } from "../services/i18n.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";

const TPL = /*html*/`
<div class="switch-widget">
    <style>

    </style>

</div>`;

export default class SwitchWidget extends NoteContextAwareWidget {

    doRender() {
        this.$widget = $(TPL);
        this.$switchButton = this.$widget.find(".switch-button");

        this.$switchToggle = this.$widget.find(".switch-toggle");
        this.$switchName = this.$widget.find(".switch-name");
        this.$helpButton = this.$widget.find(".switch-help-button");
    }

    switchOff() {}
    switchOn() {}

    /** Gets or sets whether the switch is toggled. */
    get isToggled() {
        return this.currentState;
    }

    set isToggled(state) {
        this.currentState = !!state;

        this.$switchButton.toggleClass("on", this.currentState);
    }

    /** Gets or sets whether the switch is enabled. */
    get canToggle() {
        return !this.$switchButton.hasClass("disabled");
    }

    set canToggle(isEnabled) {
        if (isEnabled) {
            this.isToggled = this.currentState; // Reapply the correct tooltip
        } else {
            this.$switchButton.attr("title", this.disabledTooltip);
        }
    }
}
