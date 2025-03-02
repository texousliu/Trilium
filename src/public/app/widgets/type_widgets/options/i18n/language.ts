import OptionsWidget from "../options_widget.js";
import type { OptionMap } from "../../../../../../services/options_interface.js";
import server from "../../../../services/server.js";
import type { Locale } from "../appearance/i18n.js";

const TPL = `
<div class="options-section">
    <h4>Languages</h4>

    <ul class="options-languages">
    </ul>

    <style>
        ul.options-languages {
            list-style-type: none;
            margin-bottom: 0;
        }
    </style>
</div>
`;

export default class LanguageOptions extends OptionsWidget {

    private $languagesContainer!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$languagesContainer = this.$widget.find(".options-languages");
    }

    async optionsLoaded(options: OptionMap) {
        const availableLocales = await server.get<Locale[]>("options/locales");

        this.$languagesContainer.empty();
        for (const locale of availableLocales) {
            const checkbox = $(`<label class="tn-checkbox">`)
                .append($('<input type="checkbox" class="form-check-input">'))
                .append(locale.name);
            this.$languagesContainer.append($("<li>").append(checkbox));
        }
    }

}
