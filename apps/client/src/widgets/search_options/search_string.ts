import AbstractSearchOption from "./abstract_search_option.js";
import SpacedUpdate from "../../services/spaced_update.js";
import server from "../../services/server.js";
import shortcutService from "../../services/shortcuts.js";
import appContext, { type EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import { Tooltip } from "bootstrap";

export default class SearchString extends AbstractSearchOption {

    private $searchString!: JQuery<HTMLElement>;
    private spacedUpdate!: SpacedUpdate;

    static async create(noteId: string) {
        await AbstractSearchOption.setAttribute(noteId, "label", "searchString");
    }

    doRender() {
        const $option = $(TPL);
        this.$searchString = $option.find(".search-string");

        this.spacedUpdate = new SpacedUpdate(async () => {

        }, 1000);

        this.$searchString.val(this.note.getLabelValue("searchString") ?? "");

        return $option;
    }

    showSearchErrorEvent({ error }: EventData<"showSearchError">) {
        let tooltip = new Tooltip(this.$searchString[0], {
            trigger: "manual",
            title: `${t("search_string.error", { error })}`,
            placement: "bottom"
        });

        tooltip.show();

        setTimeout(() => tooltip.dispose(), 4000);
    }

    focusOnSearchDefinitionEvent() {
        this.$searchString
            .val(String(this.$searchString.val()).trim() ?? appContext.lastSearchString)
            .focus()
            .select();
        this.spacedUpdate.scheduleUpdate();
    }
}
