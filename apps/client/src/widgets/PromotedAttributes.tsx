import { useEffect, useState } from "preact/hooks";
import "./PromotedAttributes.css";
import { useNoteContext } from "./react/hooks";
import { Attribute } from "../services/attribute_parser";

export default function PromotedAttributes() {
    const { note } = useNoteContext();
    const [ cells, setCells ] = useState<Attribute[]>();

    useEffect(() => {
        if (!note) return;
        const promotedDefAttrs = note.getPromotedDefinitionAttributes();
        const ownedAttributes = note.getOwnedAttributes();
        // attrs are not resorted if position changes after the initial load
        // promoted attrs are sorted primarily by order of definitions, but with multi-valued promoted attrs
        // the order of attributes is important as well
        ownedAttributes.sort((a, b) => a.position - b.position);

        const cells: Attribute[] = [];
        for (const definitionAttr of promotedDefAttrs) {
            const valueType = definitionAttr.name.startsWith("label:") ? "label" : "relation";
            const valueName = definitionAttr.name.substr(valueType.length + 1);

            let valueAttrs = ownedAttributes.filter((el) => el.name === valueName && el.type === valueType) as Attribute[];

            if (valueAttrs.length === 0) {
                valueAttrs.push({
                    attributeId: "",
                    type: valueType,
                    name: valueName,
                    value: ""
                });
            }

            if (definitionAttr.getDefinition().multiplicity === "single") {
                valueAttrs = valueAttrs.slice(0, 1);
            }

            cells.push(...valueAttrs);
        }
        setCells(cells);
    }, [ note ]);

    return (
        <div className="promoted-attributes-widget">
            <div className="promoted-attributes-container">

            </div>
        </div>
    );
}
