import { OptionMap } from "@triliumnext/commons";
import OptionsWidget from "../options_widget";

const TPL = /*html*/`
<div class="options-section">
    <h4>Features</h4>

    <label class="tn-checkbox">
        <input type="checkbox" name="emoji-enabled" />
        Enable Emoji support and auto-completion
    </label>
</div>
`;

export default class EditorFeaturesOptions extends OptionsWidget {

    private $emojiEnabledCheckbox!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);

        this.$emojiEnabledCheckbox = this.$widget.find(`input[name="emoji-enabled"]`);
        this.$emojiEnabledCheckbox.on("change", () => this.updateCheckboxOption("textNoteEmojiEnabled", this.$emojiEnabledCheckbox))
    }

    optionsLoaded(options: OptionMap) {
        this.setCheckboxState(this.$emojiEnabledCheckbox, options.textNoteEmojiEnabled);
    }

}
