import FNote from "../../entities/fnote";
import "./PromotedAttributesDisplay.css";

interface PromotedAttributesDisplayProps {
    note: FNote;
    ignoredAttributes?: string[];
}

interface AttributeWithDefinitions {
    name: string;
    type: string;
    friendlyName: string;
    value: string;
}

export default function PromotedAttributesDisplay({ note, ignoredAttributes }: PromotedAttributesDisplayProps) {
    const promotedDefinitionAttributes = useNoteAttributesWithDefinitions(note, ignoredAttributes);
    return promotedDefinitionAttributes?.length > 0 && (
        <div className="promoted-attributes">
            {promotedDefinitionAttributes?.map((attr) => {
                return (
                    <span key={attr.friendlyName} className="promoted-attribute">
                        <strong>{attr.friendlyName}:</strong> {attr.value}
                    </span>
                );
            }
            )}
        </div>
    )

}

function useNoteAttributesWithDefinitions(note: FNote, attributesToIgnore: string[] = []): AttributeWithDefinitions[] {
    const promotedDefinitionAttributes = note.getPromotedDefinitionAttributes();
    const result: AttributeWithDefinitions[] = [];

    for (const attr of promotedDefinitionAttributes) {
        const def = attr.getDefinition();
        const [ type, name ] = attr.name.split(":", 2);
        const value = note.getLabelValue(name);
        const friendlyName = def?.promotedAlias ?? name;
        if (!value) continue;
        if (attributesToIgnore.includes(name)) continue;

        result.push({ name, type, friendlyName, value });
    }
    return result;
}
