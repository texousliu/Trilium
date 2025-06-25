import FNote from "../../../entities/fnote";
import { LabelType } from "../../../services/promoted_attribute_definition_parser";

export interface PromotedAttributeInformation {
    name: string;
    title?: string;
    type?: LabelType;
}

export default function getPromotedAttributeInformation(parentNote: FNote) {
    const info: PromotedAttributeInformation[] = [];
    for (const promotedAttribute of parentNote.getPromotedDefinitionAttributes()) {
        if (promotedAttribute.type !== "label") {
            console.warn("Relations are not supported for now");
            continue;
        }

        const def = promotedAttribute.getDefinition();
        if (def.multiplicity !== "single") {
            console.warn("Multiple values are not supported for now");
            continue;
        }

        info.push({
            name: promotedAttribute.name.split(":", 2)[1],
            title: def.promotedAlias,
            type: def.labelType
        })
    }
    return info;
}
