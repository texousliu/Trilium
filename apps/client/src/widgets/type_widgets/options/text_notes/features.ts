import { OptionMap } from "@triliumnext/commons";
import OptionsWidget from "../options_widget";

const TPL = /*html*/`
<div class="options-section">
    <h4>Features</h4>

    <label class="tn-checkbox">
        <input type="checkbox" name="emoji-completion-enabled" />
        Enable Emoji auto-completion
    </label>
</div>
`;

export default class EditorFeaturesOptions extends OptionsWidget {

    private $emojiCompletionEnabledCheckbox!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);

        this.$emojiCompletionEnabledCheckbox = this.$widget.find(`input[name="emoji-completion-enabled"]`);
        this.$emojiCompletionEnabledCheckbox.on("change", () => this.updateCheckboxOption("textNoteEmojiCompletionEnabled", this.$emojiCompletionEnabledCheckbox))
    }

    optionsLoaded(options: OptionMap) {
        this.setCheckboxState(this.$emojiCompletionEnabledCheckbox, options.textNoteEmojiCompletionEnabled);
    }

}
