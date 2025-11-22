import { useEffect, useState } from "preact/hooks";
import "./PromotedAttributes.css";
import { useNoteContext } from "./react/hooks";
import { Attribute } from "../services/attribute_parser";
import FAttribute from "../entities/fattribute";

interface Cell {
    definitionAttr: FAttribute;
    valueAttr: Attribute;
    valueName: string;
}

export default function PromotedAttributes() {
    const { note } = useNoteContext();
    const [ cells, setCells ] = useState<Cell[]>();

    useEffect(() => {
        if (!note) return;
        const promotedDefAttrs = note.getPromotedDefinitionAttributes();
        const ownedAttributes = note.getOwnedAttributes();
        // attrs are not resorted if position changes after the initial load
        // promoted attrs are sorted primarily by order of definitions, but with multi-valued promoted attrs
        // the order of attributes is important as well
        ownedAttributes.sort((a, b) => a.position - b.position);

        const cells: Cell[] = [];
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

            for (const valueAttr of valueAttrs) {
                cells.push({  definitionAttr, valueAttr, valueName });
            }
        }
        setCells(cells);
    }, [ note ]);

    return (
        <div className="promoted-attributes-widget">
            <div className="promoted-attributes-container">
                {cells?.map(cell => <PromotedAttributeCell cell={cell} />)}
            </div>
        </div>
    );
}

function PromotedAttributeCell({ cell }: { cell: Cell }) {
    const { valueName, valueAttr, definitionAttr } = cell;
    const inputId = `value-${valueAttr.attributeId}`;
    const definition = definitionAttr.getDefinition();

    return (
        <div className="promoted-attribute-cell">
            <label for={inputId}>{definition.promotedAlias ?? valueName}</label>
            <input
                tabIndex={200 + definitionAttr.position}
                id={inputId}
            />
        </div>
    )
}
