import OptionsWidget from "../options_widget.js";
import server from "../../../../services/server.js";
import utils from "../../../../services/utils.js";
import { getAvailableLocales, t } from "../../../../services/i18n.js";

const TPL = /*html*/`
<div class="options-section">
    <style>
        .locale-options-container .option-row [aria-labelledby="first-week-of-year-label"] {
            display: flex;
            flex-direction: column;
        }

        .locale-options-container .option-row [aria-labelledby="first-week-of-year-label"] .tn-radio {
            margin-left: 0;
            white-space: nowrap;
        }
    </style>
</div>
`;

export default class LocalizationOptions extends OptionsWidget {

    doRender() {
        this.$widget = $(TPL);
        this.$widget.find(".restart-app-button").on("click", utils.);
    }

}
