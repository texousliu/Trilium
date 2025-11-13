import { useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import "./PromotedAttributesDisplay.css";
import { useTriliumEvent } from "../react/hooks";
import attributes from "../../services/attributes";
import { DefinitionObject } from "../../services/promoted_attribute_definition_parser";
import { formatDateTime } from "../../utils/formatters";
import { ComponentChildren } from "preact";
import Icon from "../react/Icon";
import NoteLink from "../react/NoteLink";

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
                const className = `${attr.type === "label" ? "label" + " " + attr.def.labelType : "relation"}`;
                return (
                    <span key={attr.friendlyName} className={`promoted-attribute type-${className}`}>
                        {attr.type === "relation" ? formatRelation(attr) : formatLabelValue(attr)}
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

function formatLabelValue(attr: AttributeWithDefinitions): ComponentChildren {
    let value = attr.value;
    switch (attr.def.labelType) {
        case "number":
            let formattedValue = value;
            const numberValue = Number(value);
            if (attr.def.numberPrecision) {
                formattedValue = numberValue.toFixed(attr.def.numberPrecision);
            }
            return <><strong>{attr.friendlyName}:</strong> {formattedValue}</>;
        case "date":
        case "datetime": {
            const date = new Date(value);
            const timeFormat = attr.def.labelType !== "date" ? "short" : "none";
            return <><strong>{attr.friendlyName}:</strong> {formatDateTime(date, "short", timeFormat)}</>;
        }
        case "time": {
            const date = new Date(`1970-01-01T${value}Z`);
            return <><strong>{attr.friendlyName}:</strong> {formatDateTime(date, "none", "short")}</>;
        }
        case "boolean":
            return <><Icon icon={value === "true" ? "bx bx-check-square" : "bx bx-square"} /> <strong>{attr.friendlyName}</strong></>;
        case "url":
            return <><a href={value} target="_blank" rel="noopener noreferrer">{attr.friendlyName}</a></>;
        case "color":
            return <><span style={{ color: value }}>{attr.friendlyName}</span></>;
        case "text":
        default:
            return <><strong>{attr.friendlyName}:</strong> {value}</>;
    }
}

function formatRelation(attr: AttributeWithDefinitions): ComponentChildren {
    return (
        <><strong>{attr.friendlyName}:</strong> <NoteLink notePath={attr.value} showNoteIcon /></>
    )
}

function getAttributesWithDefinitions(note: FNote, attributesToIgnore: string[] = []): AttributeWithDefinitions[] {
    const promotedDefinitionAttributes = note.getPromotedDefinitionAttributes();
    const result: AttributeWithDefinitions[] = [];
    for (const attr of promotedDefinitionAttributes) {
        const def = attr.getDefinition();
        const [ type, name ] = attr.name.split(":", 2);
        const friendlyName = def?.promotedAlias || name;
        const props: Omit<AttributeWithDefinitions, "value"> = { def, name, type, friendlyName };

        if (attributesToIgnore.includes(name)) continue;

        if (type === "label") {
            const labels = note.getLabels(name);
            for (const label of labels) {
                if (!label.value) continue;
                result.push({ ...props, value: label.value } );
            }
        } else if (type === "relation") {
            const relations = note.getRelations(name);
            for (const relation of relations) {
                if (!relation.value) continue;
                result.push({ ...props, value: relation.value } );
            }
        }
    }
    return result;
}
