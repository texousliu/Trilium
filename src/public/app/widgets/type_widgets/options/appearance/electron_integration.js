import OptionsWidget from "../options_widget.js";
import { t } from "../../../../services/i18n.js";
import utils from "../../../../services/utils.js";

const TPL = `
<div class="options-section">    
    <h4>Desktop application</h4>

    <div class="side-checkbox">
        <label class="form-check">
            <input type="checkbox" class="native-title-bar form-check-input" />
            <strong>Native title bar</strong>
            <p>For Windows and macOS, keeping the native title bar off makes the application look more compact. On Linux, keeping the native title bar on integrates better with the rest of the system.</p>
        </label>        
    </div>

    <div class="side-checkbox">
        <label class="form-check">
            <input type="checkbox" class="background-effects form-check-input" />
            <strong>Enable background effects (Windows 11 only)</strong>
            <p>The Mica effect adds a blurred, stylish background to app windows, creating depth and a modern look.</p>
        </label>        
    </div>

    <button class="btn btn-micro restart-app-button">Restart the application to view the changes</button>
</div>
`;

export default class ElectronIntegrationOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$nativeTitleBar = this.$widget.find("input.native-title-bar");
        this.$nativeTitleBar.on("change", () => this.updateCheckboxOption("nativeTitleBarVisible", this.$nativeTitleBar));

        this.$backgroundEffects = this.$widget.find("input.background-effects");
        this.$backgroundEffects.on("change", () => this.updateCheckboxOption("backgroundEffects", this.$backgroundEffects));

        const restartAppButton = this.$widget.find(".restart-app-button");
        restartAppButton.on("click", () => {
            const app = utils.dynamicRequire('@electron/remote').app;
            app.relaunch();
            app.exit();
        });
    }
    
    isEnabled() {
        return utils.isElectron();
    }

    async optionsLoaded(options) {
        this.setCheckboxState(this.$nativeTitleBar, options.nativeTitleBarVisible);
        this.setCheckboxState(this.$backgroundEffects, options.backgroundEffects);
    }
}
