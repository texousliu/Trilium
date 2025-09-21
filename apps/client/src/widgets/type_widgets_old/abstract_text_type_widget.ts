import TypeWidget from "./type_widget.js";
import appContext, { type EventData } from "../../components/app_context.js";
import froca from "../../services/froca.js";
import linkService from "../../services/link.js";
import contentRenderer from "../../services/content_renderer.js";
import utils from "../../services/utils.js";
import options from "../../services/options.js";
import attributes from "../../services/attributes.js";

export default class AbstractTextTypeWidget extends TypeWidget {
    doRender() {
        super.doRender();
        this.refreshCodeBlockOptions();
    }


    async loadReferenceLinkTitle($el: JQuery<HTMLElement>, href: string | null = null) {
        await linkService.loadReferenceLinkTitle($el, href);
    }

    refreshCodeBlockOptions() {
        const wordWrap = options.is("codeBlockWordWrap");
        this.$widget.toggleClass("word-wrap", wordWrap);
    }

    async entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.isOptionReloaded("codeBlockWordWrap")) {
            this.refreshCodeBlockOptions();
        }

        if (loadResults.getAttributeRows().find((attr) =>
            attr.type === "label" &&
            attr.name === "language" &&
            attributes.isAffecting(attr, this.note)))
        {
            await this.onLanguageChanged();
        }
    }

    async onLanguageChanged() { }

}
