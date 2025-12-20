import { Fragment, h, VNode } from "preact";
import * as hooks from "preact/hooks";

import * as triliumHooks from "../widgets/react/hooks";
import RightPanelWidget from "../widgets/sidebar/RightPanelWidget";

export interface WidgetDefinition {
    parent: "right-pane",
    render: () => VNode
}

export interface WidgetDefinitionWithType extends WidgetDefinition {
    type: "preact-widget"
}

export const preactAPI = Object.freeze({
    // Core
    h,
    Fragment,

    /**
     * Method that must be run for widget scripts that run on Preact, using JSX. The method just returns the same definition, reserved for future typechecking and perhaps validation purposes.
     *
     * @param definition the widget definition.
     */
    defineWidget(definition: WidgetDefinition) {
        return {
            type: "preact-widget",
            ...definition
        };
    },

    RightPanelWidget,

    ...hooks,
    ...triliumHooks
});
