import OptionsWidget from "../options_widget";

const TPL = /*html*/`\
<div class="options-section">
    <h4>Color theme</h4>
</div>
`;

export default class CodeTheme extends OptionsWidget {

    doRender() {
        this.$widget = $(TPL);
    }

}
