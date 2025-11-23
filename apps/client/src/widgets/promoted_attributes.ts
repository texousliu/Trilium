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

// TODO: Deduplicate
interface AttributeResult {
    attributeId: string;
}

export default class PromotedAttributesWidget extends NoteContextAwareWidget {

    async createPromotedAttributeCell(definitionAttr: FAttribute, valueAttr: Attribute, valueName: string) {
        const definition = definitionAttr.getDefinition();

        const $input = $("<input>")
            .on("change", (event) => this.promotedAttributeChanged(event));

        if (valueAttr.type === "label") {
            $wrapper.addClass(`promoted-attribute-label-${definition.labelType}`);
            if (definition.labelType === "text") {
            } else if (definition.labelType === "number") {
                let step = 1;

                for (let i = 0; i < (definition.numberPrecision || 0) && i < 10; i++) {
                    step /= 10;
                }

                $input.prop("step", step);
                $input.css("text-align", "right").css("width", "120");
            } else if (definition.labelType === "boolean") {
                $input.wrap($(`<label class="tn-checkbox"></label>`));
                $wrapper.find(".input-group").removeClass("input-group");

                if (valueAttr.value === "true") {
                    $input.prop("checked", "checked");
                }
            } else if (definition.labelType === "date") {
            } else if (definition.labelType === "datetime") {
            } else if (definition.labelType === "time") {
            } else if (definition.labelType === "url") {
                $input.prop("placeholder", t("promoted_attributes.url_placeholder"));

                const $openButton = $("<span>")
                    .addClass("input-group-text open-external-link-button bx bx-window-open")
                    .prop("title", t("promoted_attributes.open_external_link"))
                    .on("click", () => window.open($input.val() as string, "_blank"));

                $input.after($openButton);
            } else if (definition.labelType === "color") {
                const defaultColor = "#ffffff";
                $input.prop("type", "hidden");
                $input.val(valueAttr.value ?? "");

                // We insert a separate input since the color input does not support empty value.
                // This is a workaround to allow clearing the color input.
                const $colorInput = $("<input>")
                    .prop("type", "color")
                    .prop("value", valueAttr.value || defaultColor)
                    .addClass("form-control promoted-attribute-input")
                    .on("change", e => setValue((e.target as HTMLInputElement).value, e));
                $input.after($colorInput);

                const $clearButton = $("<span>")
                    .addClass("input-group-text bx bxs-tag-x")
                    .prop("title", t("promoted_attributes.remove_color"))
                    .on("click", e => setValue("", e));

                const setValue = (color: string, event: JQuery.TriggeredEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) => {
                    $input.val(color);
                    if (!color) {
                        $colorInput.val(defaultColor);
                    }
                    event.target = $input[0]; // Set the event target to the main input
                    this.promotedAttributeChanged(event);
                };

                $colorInput.after($clearButton);
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

    async promotedAttributeChanged(event: JQuery.TriggeredEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) {
        const $attr = $(event.target);

        let value;

        if ($attr.prop("type") === "checkbox") {
            value = $attr.is(":checked") ? "true" : "false";
        } else if ($attr.attr("data-attribute-type") === "relation") {
            const selectedPath = $attr.getSelectedNotePath();

            value = selectedPath ? treeService.getNoteIdFromUrl(selectedPath) : "";
        } else {
            value = $attr.val();
        }

        const result = await server.put<AttributeResult>(
            `notes/${this.noteId}/attribute`,
            {
                attributeId: $attr.attr("data-attribute-id"),
                type: $attr.attr("data-attribute-type"),
                name: $attr.attr("data-attribute-name"),
                value: value
            },
            this.componentId
        );

        $attr.attr("data-attribute-id", result.attributeId);
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
