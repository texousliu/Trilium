import { useState } from "preact/hooks";
import FNote from "../../entities/fnote";
import "./PromotedAttributesDisplay.css";
import { useTriliumEvent } from "../react/hooks";
import attributes from "../../services/attributes";
import { DefinitionObject } from "../../services/promoted_attribute_definition_parser";
import { formatDateTime } from "../../utils/formatters";
import { ComponentChildren, CSSProperties } from "preact";
import Icon from "../react/Icon";
import NoteLink from "../react/NoteLink";
import { getReadableTextColor } from "../../services/css_class_manager";

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
            {promotedDefinitionAttributes?.map(attr => buildPromotedAttribute(attr))}
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

function PromotedAttribute({ attr, children, style }: { attr: AttributeWithDefinitions, children: ComponentChildren, style?: CSSProperties }) {
    const className = `${attr.type === "label" ? "label" + " " + attr.def.labelType : "relation"}`;

    return (
        <span key={attr.friendlyName} className={`promoted-attribute type-${className}`} style={style}>
            {children}
        </span>
    )
}

function buildPromotedAttribute(attr: AttributeWithDefinitions): ComponentChildren {
    if (attr.type === "relation") {
        return <PromotedAttribute attr={attr}><strong>{attr.friendlyName}:</strong> <NoteLink notePath={attr.value} showNoteIcon /></PromotedAttribute>
    }

    let value = attr.value;
    switch (attr.def.labelType) {
        case "number":
            let formattedValue = value;
            const numberValue = Number(value);
            if (attr.def.numberPrecision) {
                formattedValue = numberValue.toFixed(attr.def.numberPrecision);
            }
            return <PromotedAttribute attr={attr}><strong>{attr.friendlyName}:</strong> {formattedValue}</PromotedAttribute>;
        case "date":
        case "datetime": {
            const date = new Date(value);
            const timeFormat = attr.def.labelType !== "date" ? "short" : "none";
            return <PromotedAttribute attr={attr}><strong>{attr.friendlyName}:</strong> {formatDateTime(date, "short", timeFormat)}</PromotedAttribute>;
        }
        case "time": {
            const date = new Date(`1970-01-01T${value}Z`);
            return <PromotedAttribute attr={attr}><strong>{attr.friendlyName}:</strong> {formatDateTime(date, "none", "short")}</PromotedAttribute>;
        }
        case "boolean":
            return <PromotedAttribute attr={attr}><Icon icon={value === "true" ? "bx bx-check-square" : "bx bx-square"} /> <strong>{attr.friendlyName}</strong></PromotedAttribute>;
        case "url":
            return <PromotedAttribute attr={attr}><a href={value} target="_blank" rel="noopener noreferrer">{attr.friendlyName}</a></PromotedAttribute>;
        case "color":
            return <PromotedAttribute attr={attr} style={{ backgroundColor: value, color: getReadableTextColor(value) }}>{attr.friendlyName}</PromotedAttribute>;
        case "text":
        default:
            return <PromotedAttribute attr={attr}><strong>{attr.friendlyName}:</strong> {value}</PromotedAttribute>;
    }
}

function getAttributesWithDefinitions(note: FNote, attributesToIgnore: string[] = []): AttributeWithDefinitions[] {
    const promotedDefinitionAttributes = note.getAttributeDefinitions();
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
