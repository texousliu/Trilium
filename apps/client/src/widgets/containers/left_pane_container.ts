import options from "../../services/options.js";
import FlexContainer from "./flex_container.js";
import appContext, { type EventData } from "../../components/app_context.js";
import type Component from "../../components/component.js";

export default class LeftPaneContainer extends FlexContainer<Component> {
    private currentLeftPaneVisible: boolean;
    
    constructor() {
        super("column");

        this.currentLeftPaneVisible = options.is("leftPaneVisible");

        this.id("left-pane");
        this.css("height", "100%");
        this.collapsible();
    }

    isEnabled() {
        return super.isEnabled() && this.currentLeftPaneVisible;
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("leftPaneVisible") && document.hasFocus()) {
            // options.is("leftPaneVisible") changed — it may or may not be the same as currentLeftPaneVisible, but as long as the window is focused, the left pane visibility should be toggled.
            this.currentLeftPaneVisible = !this.currentLeftPaneVisible;
            const visible = this.isEnabled();
            this.toggleInt(visible);

            if (visible) {
                this.triggerEvent("focusTree", {});
            } else {
                this.triggerEvent("focusOnDetail", { ntxId: appContext.tabManager.getActiveContext()?.ntxId });
            }
        }
    }
}
