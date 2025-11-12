import FNote from "../../entities/fnote";

interface PromotedAttributesDisplayProps {
    note: FNote;
}

export default function PromotedAttributesDisplay({ note }: PromotedAttributesDisplayProps) {
    const promotedDefinitionAttributes = note.getPromotedDefinitionAttributes();

    return (
        <div className="promoted-attributes">
            {promotedDefinitionAttributes.map((attr) => {
                const def = attr.getDefinition();
                const [ type, name ] = attr.name.split(":", 2);
                const value = note.getLabelValue(name);
                const friendlyName = def?.promotedAlias ?? name;
                if (!value) return null;

                return (
                    <div key={attr.name} className="promoted-attribute">
                        <strong>{friendlyName}:</strong> {value}
                    </div>
                );
            }
            )}
        </div>
    )

}
