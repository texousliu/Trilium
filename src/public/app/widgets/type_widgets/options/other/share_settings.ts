import OptionsWidget from "../options_widget.js";
import options from "../../../../services/options.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap, OptionNames } from "../../../../../../services/options_interface.js";

const TPL = `
<div class="card-body">
    <h4>${t("Share Settings")}</h4>
    
    <div class="form-check">
        <label class="form-check-label">
            <input class="form-check-input" type="checkbox" name="redirectBareDomain" value="true">
            ${t("Redirect bare domain to Share page")}
        </label>
        <p class="form-text">${t("When enabled, accessing the root URL will redirect to the Share page instead of Login")}</p>
    </div>

    <div class="form-check">
        <label class="form-check-label">
            <input class="form-check-input" type="checkbox" name="showLoginInShareTheme" value="true">
            ${t("Show Login link in Share theme")}
        </label>
        <p class="form-text">${t("Add a login link to the Share page footer")}</p>
    </div>
</div>`;

export default class ShareSettingsOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.contentSized();

        // Add change handlers for both checkboxes
        this.$widget.find('input[type="checkbox"]').on("change", () => this.save());
    }

    async optionsLoaded(options: OptionMap) {
        this.$widget.find('input[name="redirectBareDomain"]').prop("checked", options.redirectBareDomain === "true");

        this.$widget.find('input[name="showLoginInShareTheme"]').prop("checked", options.showLoginInShareTheme === "true");
    }

    async save() {
        const redirectBareDomain = this.$widget.find('input[name="redirectBareDomain"]').prop("checked");
        await this.updateOption<"redirectBareDomain">("redirectBareDomain", redirectBareDomain.toString());

        const showLoginInShareTheme = this.$widget.find('input[name="showLoginInShareTheme"]').prop("checked");
        await this.updateOption<"showLoginInShareTheme">("showLoginInShareTheme", showLoginInShareTheme.toString());
    }
}
