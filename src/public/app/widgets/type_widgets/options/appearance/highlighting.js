import library_loader from "../../../../services/library_loader.js";
import server from "../../../../services/server.js";
import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <h4>Syntax highlighting</h4>

    <div class="form-group row">
        <div class="col-6">
            <label>Theme</label>
            <select class="theme-select form-select"></select>
        </div>
    </div>
</div>
`;

export default class HighlightingOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);        
        this.$themeSelect = this.$widget.find(".theme-select");
        this.$themeSelect.on("change", async () => {
            const newTheme = this.$themeSelect.val();
            library_loader.loadHighlightingTheme(newTheme);
            await server.put(`options/highlightingTheme/${newTheme}`);
        });
    }

    async optionsLoaded(options) {
        const themes = await server.get("options/highlighting-themes");
        this.$themeSelect.empty();

        for (const theme of themes) {
            this.$themeSelect.append($("<option>")
                .attr("value", theme.val)
                .text(theme.title));
        }
        this.$themeSelect.val(options.highlightingTheme);
    }
}