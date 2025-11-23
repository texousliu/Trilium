import { t } from "../services/i18n.js";
import server from "../services/server.js";
import ws from "../services/ws.js";
import treeService from "../services/tree.js";
import noteAutocompleteService from "../services/note_autocomplete.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";
import attributeService from "../services/attributes.js";
import options from "../services/options.js";
import utils from "../services/utils.js";
import type FNote from "../entities/fnote.js";
import type { Attribute } from "../services/attribute_parser.js";
import type FAttribute from "../entities/fattribute.js";
import type { EventData } from "../components/app_context.js";


export default class PromotedAttributesWidget extends NoteContextAwareWidget {

    async createPromotedAttributeCell(definitionAttr: FAttribute, valueAttr: Attribute, valueName: string) {
        const definition = definitionAttr.getDefinition();

        const $input = $("<input>")
            .on("change", (event) => this.promotedAttributeChanged(event));

        if (valueAttr.type === "label") {
            $wrapper.addClass(`promoted-attribute-label-${definition.labelType}`);
            } else if (definition.labelType === "boolean") {
                $input.wrap($(`<label class="tn-checkbox"></label>`));
                $wrapper.find(".input-group").removeClass("input-group");

                if (valueAttr.value === "true") {
                    $input.prop("checked", "checked");
                }
            } else {
                ws.logError(t("promoted_attributes.unknown_label_type", { type: definition.labelType }));
            }
        } else if (valueAttr.type === "relation") {
            if (valueAttr.value) {
                $input.val(await treeService.getNoteTitle(valueAttr.value));
            }

            if (utils.isDesktop()) {
                // no need to wait for this
                noteAutocompleteService.initNoteAutocomplete($input, { allowCreatingNotes: true });

                $input.on("autocomplete:noteselected", (event, suggestion, dataset) => {
                    this.promotedAttributeChanged(event);
                });

                $input.setSelectedNotePath(valueAttr.value);
            } else {
                // we can't provide user a way to edit the relation so make it read only
                $input.attr("readonly", "readonly");
            }
        } else {
            ws.logError(t(`promoted_attributes.unknown_attribute_type`, { type: valueAttr.type }));
            return;
        }

        return $wrapper;
    }

    focus() {
        this.$widget.find(".promoted-attribute-input:first").focus();
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows(this.componentId).find((attr) => attributeService.isAffecting(attr, this.note))) {
            this.refresh();
        }
    }
}
