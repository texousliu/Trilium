import FNote from "../../entities/fnote";
import "./PromotedAttributesDisplay.css";

interface PromotedAttributesDisplayProps {
    note: FNote;
    ignoredAttributes?: string[];
}

export default function PromotedAttributesDisplay({ note, ignoredAttributes }: PromotedAttributesDisplayProps) {
    const promotedDefinitionAttributes = note.getPromotedDefinitionAttributes();

    return promotedDefinitionAttributes.length > 0 && (
        <div className="promoted-attributes">
            {promotedDefinitionAttributes.map((attr) => {
                const def = attr.getDefinition();
                const [ type, name ] = attr.name.split(":", 2);
                const value = note.getLabelValue(name);
                const friendlyName = def?.promotedAlias ?? name;
                if (!value) return null;
                if (ignoredAttributes && ignoredAttributes.includes(name)) return null;

                return (
                    <span key={attr.name} className="promoted-attribute">
                        <strong>{friendlyName}:</strong> {value}
                    </span>
                );
            }
            )}
        </div>
    )

}
