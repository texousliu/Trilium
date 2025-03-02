import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <h4>Languages</h4>

    The list of languages should go here.
</div>
`;

export default class LanguageOptions extends OptionsWidget {

    doRender() {
        this.$widget = $(TPL);
    }

}
