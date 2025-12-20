import { Fragment, h } from "preact";
import * as hooks from "preact/hooks";

export const preactAPI = Object.freeze({
    // Core
    h,
    Fragment,

    ...hooks
});
