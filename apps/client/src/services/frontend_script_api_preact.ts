import { Fragment, h } from "preact";
import * as hooks from "preact/hooks";

import RightPanelWidget from "../widgets/sidebar/RightPanelWidget";

export const preactAPI = Object.freeze({
    // Core
    h,
    Fragment,

    RightPanelWidget,

    ...hooks
});
