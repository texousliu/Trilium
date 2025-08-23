import NoteContextAwareWidget from "../note_context_aware_widget.js";
import attributeService from "../../services/attributes.js";
import { t } from "../../services/i18n.js";
import type FNote from "../../entities/fnote.js";
import type { EventData } from "../../components/app_context.js";
import { bookPropertiesConfig, BookProperty } from "./book_properties_config.js";
import attributes from "../../services/attributes.js";

export default class BookPropertiesWidget extends NoteContextAwareWidget {

    private $viewTypeSelect!: JQuery<HTMLElement>;
    private $propertiesContainer!: JQuery<HTMLElement>;
    private labelsToWatch: string[] = [];

    doRender() {

        this.$viewTypeSelect = this.$widget.find(".view-type-select");
        this.$viewTypeSelect.on("change", () => this.toggleViewType(String(this.$viewTypeSelect.val())));

        this.$propertiesContainer = this.$widget.find(".book-properties-container");
    }

    async refreshWithNote(note: FNote) {
        if (!this.note) {
            return;
        }

        const viewType = this.note.getLabelValue("viewType") || "grid";

        this.$viewTypeSelect.val(viewType);

        this.$propertiesContainer.empty();

        const bookPropertiesData = bookPropertiesConfig[viewType];
        if (bookPropertiesData) {
            for (const property of bookPropertiesData.properties) {
                this.$propertiesContainer.append(this.renderBookProperty(property));
                this.labelsToWatch.push(property.bindToLabel);
            }
        }
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getAttributeRows().find((attr) =>
                attr.noteId === this.noteId
                && (attr.name === "viewType" || this.labelsToWatch.includes(attr.name ?? "")))) {
            this.refresh();
        }
    }

    renderBookProperty(property: BookProperty) {
        const $container = $("<div>");
        $container.addClass(`type-${property.type}`);
        const note = this.note;
        if (!note) {
            return $container;
        }
        switch (property.type) {
            case "checkbox":
                const $label = $("<label>").text(property.label);
                const $checkbox = $("<input>", {
                    type: "checkbox",
                    class: "form-check-input",
                });
                $checkbox.on("change", () => {
                    if ($checkbox.prop("checked")) {
                        attributes.setLabel(note.noteId, property.bindToLabel);
                    } else {
                        attributes.removeOwnedLabelByName(note, property.bindToLabel);
                    }
                });
                $checkbox.prop("checked", note.hasOwnedLabel(property.bindToLabel));
                $label.prepend($checkbox);
                $container.append($label);
                break;
            case "number":
                const $numberInput = $("<input>", {
                    type: "number",
                    class: "form-control form-control-sm",
                    value: note.getLabelValue(property.bindToLabel) || "",
                    width: property.width ?? 100,
                    min: property.min ?? 0
                });
                $numberInput.on("change", () => {
                    const value = $numberInput.val();
                    if (value === "") {
                        attributes.removeOwnedLabelByName(note, property.bindToLabel);
                    } else {
                        attributes.setLabel(note.noteId, property.bindToLabel, String(value));
                    }
                });
                $container.append($("<label>")
                    .text(property.label)
                    .append("&nbsp;".repeat(2))
                    .append($numberInput));
                break;
            case "combobox":
                const $select = $("<select>", {
                    class: "form-select form-select-sm"
                });
                const actualValue = note.getLabelValue(property.bindToLabel) ?? property.defaultValue ?? "";
                for (const option of property.options) {
                    if ("items" in option) {
                        const $optGroup = $("<optgroup>", { label: option.name });
                        for (const item of option.items) {
                            buildComboBoxItem(item, actualValue).appendTo($optGroup);
                        }
                        $optGroup.appendTo($select);
                    } else {
                        buildComboBoxItem(option, actualValue).appendTo($select);
                    }
                }
                $select.on("change", () => {
                    const value = $select.val();
                    if (value === null || value === "") {
                        attributes.removeOwnedLabelByName(note, property.bindToLabel);
                    } else {
                        attributes.setLabel(note.noteId, property.bindToLabel, String(value));
                    }
                });
                $container.append($("<label>")
                    .text(property.label)
                    .append("&nbsp;".repeat(2))
                    .append($select));
                break;
        }

        return $container;
    }


}

function buildComboBoxItem({ value, label }: { value: string, label: string }, actualValue: string) {
    const $option = $("<option>", {
        value,
        text: label
    });
    if (actualValue === value) {
        $option.prop("selected", true);
    }
    return $option;
}
