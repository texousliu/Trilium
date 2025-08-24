import AbstractSearchOption from "./abstract_search_option.js";
import SpacedUpdate from "../../services/spaced_update.js";
import server from "../../services/server.js";
import shortcutService from "../../services/shortcuts.js";
import appContext, { type EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import { Tooltip } from "bootstrap";

export default class SearchString extends AbstractSearchOption {

    focusOnSearchDefinitionEvent() {
        this.$searchString
            .val(String(this.$searchString.val()).trim() ?? appContext.lastSearchString)
            .focus()
            .select();
        this.spacedUpdate.scheduleUpdate();
    }
}
