import options from "../../services/options.js";
import splitService from "../../services/resizer.js";
import CommandButtonWidget from "./command_button.js";
import { t } from "../../services/i18n.js";
import type { EventData } from "../../components/app_context.js";

export default class LeftPaneToggleWidget extends CommandButtonWidget {
    private currentLeftPaneVisible: boolean;

    constructor(isHorizontalLayout: boolean) {
        super();

        this.currentLeftPaneVisible = options.is("leftPaneVisible");

        this.class(isHorizontalLayout ? "toggle-button" : "launcher-button");

        this.settings.icon = () => {
            if (options.get("layoutOrientation") === "horizontal") {
                return "bx-sidebar";
            }

            return options.is("leftPaneVisible") ? "bx-chevrons-left" : "bx-chevrons-right";
        };

        this.settings.title = () => (options.is("leftPaneVisible") ? t("left_pane_toggle.hide_panel") : t("left_pane_toggle.show_panel"));

        this.settings.command = () => (this.currentLeftPaneVisible ? "hideLeftPane" : "showLeftPane");

        if (isHorizontalLayout) {
            this.settings.titlePlacement = "bottom";
        }
    }

    refreshIcon() {
        super.refreshIcon();
        splitService.setupLeftPaneResizer(this.currentLeftPaneVisible);
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("leftPaneVisible") && document.hasFocus()) {
            this.currentLeftPaneVisible = options.is("leftPaneVisible");
            this.refreshIcon();
        }
    }
}
