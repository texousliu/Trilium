import { useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import "./PromotedAttributesDisplay.css";
import { useTriliumEvent } from "../react/hooks";
import attributes from "../../services/attributes";
import { DefinitionObject } from "../../services/promoted_attribute_definition_parser";

interface PromotedAttributesDisplayProps {
    note: FNote;
    ignoredAttributes?: string[];
}

interface AttributeWithDefinitions {
    friendlyName: string;
    name: string;
    type: string;
    value: string;
    def: DefinitionObject;
}

export default function PromotedAttributesDisplay({ note, ignoredAttributes }: PromotedAttributesDisplayProps) {
    const promotedDefinitionAttributes = useNoteAttributesWithDefinitions(note, ignoredAttributes);
    return promotedDefinitionAttributes?.length > 0 && (
        <div className="promoted-attributes">
            {promotedDefinitionAttributes?.map((attr) => {
                return (
                    <span key={attr.friendlyName} className="promoted-attribute">
                        <strong>{attr.friendlyName}:</strong> {formatLabelValue(attr)}
                    </span>
                );
            }
            )}
        </div>
    )

}

function useNoteAttributesWithDefinitions(note: FNote, attributesToIgnore:  string[] = []): AttributeWithDefinitions[] {
    const [ promotedDefinitionAttributes, setPromotedDefinitionAttributes ] = useState<AttributeWithDefinitions[]>(getAttributesWithDefinitions(note, attributesToIgnore));

    useTriliumEvent("entitiesReloaded", ({ loadResults }) => {
        if (loadResults.getAttributeRows().some(attr => attributes.isAffecting(attr, note))) {
            setPromotedDefinitionAttributes(getAttributesWithDefinitions(note, attributesToIgnore));
        }
    });

    return promotedDefinitionAttributes;
}

function formatLabelValue(attr: AttributeWithDefinitions): string {
    let value = attr.value;
    switch (attr.def.labelType) {
        case "number":
            const numberValue = Number(value);
            if (attr.def.numberPrecision) {
                return numberValue.toFixed(attr.def.numberPrecision);
            } else {
                return numberValue.toString();
            }
        case "text":
        default:
            return value;
    }
}

function getAttributesWithDefinitions(note: FNote, attributesToIgnore: string[] = []): AttributeWithDefinitions[] {
    const promotedDefinitionAttributes = note.getPromotedDefinitionAttributes();
    const result: AttributeWithDefinitions[] = [];
    for (const attr of promotedDefinitionAttributes) {
        const def = attr.getDefinition();
        const [ type, name ] = attr.name.split(":", 2);
        const value = note.getLabelValue(name);
        const friendlyName = def?.promotedAlias ?? name;
        if (!value) continue;
        if (attributesToIgnore.includes(name)) continue;

        result.push({ def, name, type, value, friendlyName });
    }
    return result;
}
