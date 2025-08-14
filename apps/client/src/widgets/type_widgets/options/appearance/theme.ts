import OptionsWidget from "../options_widget.js";
import server from "../../../../services/server.js";
import utils from "../../../../services/utils.js";
import { t } from "../../../../services/i18n.js";
import type { OptionMap } from "@triliumnext/commons";

const TPL = /*html*/`
<div class="options-section">
    <div class="form-group row">
        <div class="col-md-6 side-checkbox">
            <label class="form-check tn-checkbox">
                <input type="checkbox" class="override-theme-fonts form-check-input">
                ${t("theme.override_theme_fonts_label")}
            </label>
        </div>
    </div>
</div>
`;

export default class ThemeOptions extends OptionsWidget {

    private $overrideThemeFonts!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$themeSelect = this.$widget.find(".theme-select");
        this.$overrideThemeFonts = this.$widget.find(".override-theme-fonts");


        this.$overrideThemeFonts.on("change", () => this.updateCheckboxOption("overrideThemeFonts", this.$overrideThemeFonts));
    }

    async optionsLoaded(options: OptionMap) {
        this.setCheckboxState(this.$overrideThemeFonts, options.overrideThemeFonts);

        this.$widget.find(`input[name="layout-orientation"][value="${options.layoutOrientation}"]`).prop("checked", "true");
    }
}
