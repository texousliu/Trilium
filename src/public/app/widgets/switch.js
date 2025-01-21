import { t } from "../services/i18n.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";

const TPL = `
<div class="switch-widget">
    <style>
    .switch-widget {
        display: flex;
        align-items: center;
    }

    .switch {
        display: flex;
        position: relative;
    }

    .switch-widget .switch-button {
        position: relative;
    }

    .switch-widget .slider.checked {
        background-color: var(--main-text-color);
    }

    .switch-widget .slider.checked:before {
        transform: translateX(26px);
    }

    .switch-widget .switch-disabled {
        opacity: 70%;
        pointer-events: none;
    }

    .switch-widget .switch-help-button {
        font-weight: 900;
        border: 0;
        background: none;
        cursor: pointer;
        color: var(--main-text-color);
    }

    .switch-widget .switch-button {
        background: red !important;
    }

    .switch-widget .switch-button.on {
        background: green !important;
    }
    </style>

    <div class="switch">
        <span class="switch-name"></span>
        &nbsp;
        <span class="switch-button">
            [...]
        </span>
    </div>

    <button class="switch-help-button" type="button" data-help-page="" title="${t("open-help-page")}" style="display: none;">?</button>
</div>`;

export default class SwitchWidget extends NoteContextAwareWidget {

    switchOnName;
    switchOnTooltip;

    switchOffName;
    switchOffTooltip;

    currentState = false;

    doRender() {
        this.$widget = $(TPL);
        this.$switchButton = this.$widget.find(".switch-button");
        this.$switchButton.on("click", () => this.toggle(!this.currentState));

        this.$switchName = this.$widget.find(".switch-name");

        this.$helpButton = this.$widget.find(".switch-help-button");
    }

    toggle(state) {
        if (state) {
            this.switchOn();
        } else {
            this.switchOff();
        }
    }

    switchOff() {}
    switchOn() {}

    /** Gets or sets whether the switch is toggled. */
    get isToggled() {
        return this.currentState;
    }

    set isToggled(state) {
        this.currentState = !!state;

        if (this.currentState) {
            this.$switchName.text(this.switchOffName);

            this.$switchButton.attr("title", this.switchOffTooltip);
            this.$switchButton.addClass("on");
        } else {
            this.$switchName.text(this.switchOnName);

            this.$switchButton.attr("title", this.switchOnTooltip);
            this.$switchButton.removeClass("on");
        }
    }
}
