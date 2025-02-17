import OptionsWidget from "../options_widget.js";
import options from "../../../../services/options.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap, OptionNames } from "../../../../../../services/options_interface.js";

const TPL = `
<div class="card-body">
    <h4>${t("share.title")}</h4>

    <div class="form-check">
        <label class="form-check-label">
            <input class="form-check-input" type="checkbox" name="redirectBareDomain" value="true">
            ${t("share.redirect_bare_domain")}
        </label>
        <p class="form-text">${t("share.redirect_bare_domain_description")}</p>
    </div>

    <div class="form-check">
        <label class="form-check-label">
            <input class="form-check-input" type="checkbox" name="showLoginInShareTheme" value="true">
            ${t("share.show_login_link")}
        </label>
        <p class="form-text">${t("share.show_login_link_description")}</p>
        <p>&nbsp;</p>
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
