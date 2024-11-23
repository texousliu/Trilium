import utils from "../services/utils.js";
import QuickSearchWidget from "./quick_search.js";

/**
 * Similar to the {@link QuickSearchWidget} but meant to be included inside the launcher bar.
 * 
 * <p>
 * Adds specific tweaks such as:
 * 
 * - Hiding the widget on mobile.
 */
export default class QuickSearchLauncherWidget extends QuickSearchWidget {

    isEnabled() {
        if (utils.isMobile()) {
            return false;
        }

        return super.isEnabled();
    }

}