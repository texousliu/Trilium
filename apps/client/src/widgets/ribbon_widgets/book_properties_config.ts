import FNote from "../../entities/fnote";
import attributes from "../../services/attributes";
import { ViewTypeOptions } from "../../services/note_list_renderer"

interface BookConfig {
    properties: BookProperty[]
}

interface BookProperty {
    label: string;
    type: "checkbox",
    bindToLabel: string
}

export const bookPropertiesConfig: Record<ViewTypeOptions, BookConfig> = {
    calendar: {
        properties: [
            {
                label: "Hide weekends",
                type: "checkbox",
                bindToLabel: "calendar:hideWeekends"
            },
            {
                label: "Show week numbers",
                type: "checkbox",
                bindToLabel: "calendar:weekNumbers"
            }
        ]
    }
};

export function renderBookProperty(property: BookProperty, note: FNote) {
    const $container = $("<div>");
    const $label = $("<label>").text(property.label);
    $container.append($label);

    switch (property.type) {
        case "checkbox":
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
            break;
        default:
            throw new Error(`Unknown property type: ${property.type}`);
    }

    return $container;
}
