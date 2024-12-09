import OptionsWidget from "../options_widget.js";
import { t } from "../../../../services/i18n.js";
import utils from "../../../../services/utils.js";

const TPL = `
<div class="options-section">
    <h4>${t("native_title_bar.title")}</h4>
    
    <select class="native-title-bar-select form-control">
        <option value="show">${t("native_title_bar.enabled")}</option>
        <option value="hide">${t("native_title_bar.disabled")}</option>
    </select>
</div>

<div class="options-section">
    <h4>Background effects</h4>    

    <div class="side-checkbox">
        <label class="form-check">
            <input type="checkbox" class="background-effects form-check-input" />
            <strong>Enable background effects (Windows 11 only)</strong>
            <p>On the desktop application, it's possible to use a semi-transparent background tinted in the colors of the user's wallpaper to add a touch of color.</p>
        </label>
    </div>
</div>
`;

export default class ElectronIntegrationOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$nativeTitleBarSelect = this.$widget.find(".native-title-bar-select");
        this.$nativeTitleBarSelect.on('change', () => {
            const nativeTitleBarVisible = this.$nativeTitleBarSelect.val() === 'show' ? 'true' : 'false';

            this.updateOption('nativeTitleBarVisible', nativeTitleBarVisible);
        });

        this.$backgroundEffects = this.$widget.find("input.background-effects");
        this.$backgroundEffects.on("change", async () => {
            await this.updateCheckboxOption("backgroundEffects", this.$backgroundEffects);
            utils.reloadFrontendApp("background effect change");
        });
    }
    
    isEnabled() {
        return utils.isElectron();
    }

    async optionsLoaded(options) {
        this.$nativeTitleBarSelect.val(options.nativeTitleBarVisible === 'true' ? 'show' : 'hide');
        this.setCheckboxState(this.$backgroundEffects, options.backgroundEffects);
    }
}
