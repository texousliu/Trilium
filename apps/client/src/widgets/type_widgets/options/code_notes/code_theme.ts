import type { OptionMap } from "@triliumnext/commons";
import OptionsWidget from "../options_widget";
import server from "../../../../services/server";

// TODO: Deduplicate
interface Theme {
    title: string;
    val: string;
}

type Response = Theme[];

const TPL = /*html*/`\
<div class="options-section">
    <h4>Color theme</h4>

    <div class="form-group row">
        <div class="col-md-6">
            <label for="color-theme">Color scheme</label>
            <select id="color-theme" class="theme-select form-select"></select>
        </div>
    </div>
</div>
`;

export default class CodeTheme extends OptionsWidget {

    private $themeSelect!: JQuery<HTMLElement>;

    doRender() {
        this.$widget = $(TPL);
        this.$themeSelect = this.$widget.find(".theme-select");
    }

    async optionsLoaded(options: OptionMap) {
        const themes = await server.get<Response>("options/codenote-themes");
        this.$themeSelect.empty();

        for (const theme of themes) {
            const option = $("<option>").attr("value", theme.val).text(theme.title);
            this.$themeSelect.append(option);
        }
    }

}
