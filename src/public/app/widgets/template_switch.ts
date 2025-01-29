import SwitchWidget from "./switch.js";
import attributeService from "../services/attributes.js";
import { t } from "../services/i18n.js";
import type FNote from "../entities/fnote.js";
import type { EventData } from "../components/app_context.js";

/**
 * Switch for the basic properties widget which allows the user to select whether the note is a template or not, which toggles the `#template` attribute.
 */
export default class TemplateSwitchWidget extends SwitchWidget {
    isEnabled() {
        return super.isEnabled() && !this.noteId?.startsWith("_options");
    }

    doRender() {
        super.doRender();

        this.$switchOnName.text(t("template_switch.template"));
        this.$switchOnButton.attr("title", t("template_switch.toggle-on-hint"));

        this.$switchOffName.text(t("template_switch.template"));
        this.$switchOffButton.attr("title", t("template_switch.toggle-off-hint"));

        this.$helpButton.attr("data-help-page", "template.html").show();
    }

    async switchOn() {
        if (this.noteId) {
            await attributeService.setLabel(this.noteId, "template");
        }
    }

    async switchOff() {
        if (!this.note || !this.noteId) {
            return;
        }

        for (const templateAttr of this.note.getOwnedLabels("template")) {
            await attributeService.removeAttributeById(this.noteId, templateAttr.attributeId);
        }
    }

    async refreshWithNote(note: FNote) {
        const isTemplate = note.hasLabel("template");
        this.$switchOn.toggle(!isTemplate);
        this.$switchOff.toggle(!!isTemplate);
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows().find((attr) => attr.type === "label" && attr.name === "template" && attr.noteId === this.noteId)) {
            this.refresh();
        }
    }
}
