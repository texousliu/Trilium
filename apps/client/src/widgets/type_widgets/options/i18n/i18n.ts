import OptionsWidget from "../options_widget.js";
import server from "../../../../services/server.js";
import utils from "../../../../services/utils.js";
import { getAvailableLocales, t } from "../../../../services/i18n.js";
import type { OptionMap, Locale } from "@triliumnext/commons";

const TPL = /*html*/`
<div class="options-section">
    <div class="locale-options-container">
        <div class="option-row min-days-row" style="display: none;">
            <label for="min-days-in-first-week">${}</label>
            <select id="min-days-in-first-week" class="form-select">
                ${
        .map(num => `<option value="${num}">${num}</option>`)
        .join('')}
            </select>
        </div>

        <p class="form-text use-tn-links">${t("i18n.first-week-info")}</p>

        <div class="admonition warning" role="alert">
            ${t("i18n.first-week-warning")}
        </div>

        <div class="option-row centered">
            <button class="btn btn-secondary btn-micro restart-app-button">${t("electron_integration.restart-app-button")}</button>
        </div>
    </div>

    <style>
        .locale-options-container .option-row {
            border-bottom: 1px solid var(--main-border-color);
            display: flex;
            align-items: center;
            padding: 0.5em 0;
        }

        .locale-options-container .option-row > label {
            width: 40%;
            margin-bottom: 0 !important;
        }

        .locale-options-container .option-row > select {
            width: 60%;
        }

        .locale-options-container .option-row:last-of-type {
            border-bottom: unset;
        }

        .locale-options-container .option-row.centered {
            justify-content: center;
        }

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
        this.$widget.find(".restart-app-button").on("click", utils.restartDesktopApp);
    }

}
