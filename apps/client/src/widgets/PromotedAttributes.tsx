import { useEffect, useState } from "preact/hooks";
import "./PromotedAttributes.css";
import { useNoteContext, useNoteLabel } from "./react/hooks";
import { Attribute } from "../services/attribute_parser";
import FAttribute from "../entities/fattribute";
import clsx from "clsx";
import { t } from "../services/i18n";
import { DefinitionObject } from "../services/promoted_attribute_definition_parser";

interface Cell {
    definitionAttr: FAttribute;
    definition: DefinitionObject;
    valueAttr: Attribute;
    valueName: string;
}

export default function PromotedAttributes() {
    const { note } = useNoteContext();
    const [ cells, setCells ] = useState<Cell[]>();
    const [ viewType ] = useNoteLabel(note, "viewType");

    useEffect(() => {
        if (!note || viewType === "table") {
            setCells([]);
            return;
        }
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
                const definition = definitionAttr.getDefinition();
                cells.push({  definitionAttr, definition, valueAttr, valueName });
            }
        }
        setCells(cells);
    }, [ note, viewType ]);

    return (
        <div className="promoted-attributes-widget">
            <div className="promoted-attributes-container">
                {cells?.map(cell => <PromotedAttributeCell cell={cell} />)}
            </div>
        </div>
    );
}

function PromotedAttributeCell({ cell }: { cell: Cell }) {
    const { valueName, valueAttr, definition, definitionAttr } = cell;
    const inputId = `value-${valueAttr.attributeId}`;

    return (
        <div className="promoted-attribute-cell">
            <label for={inputId}>{definition.promotedAlias ?? valueName}</label>
            <div className="input-group">
                <input
                    tabIndex={200 + definitionAttr.position}
                    id={inputId}
                />
            </div>
            <ActionCell cell={cell} />
            <MultiplicityCell cell={cell} />
        </div>
    )
}

function ActionCell({ cell  }: { cell: Cell }) {
    return (
        <div>

        </div>
    )
}

function MultiplicityCell({ cell }: { cell: Cell }) {
    return (cell.definition.multiplicity === "multi" &&
        <td className="multiplicity">
            <PromotedActionButton icon="bx bx-plus" title={t("promoted_attributes.add_new_attribute")} />{' '}
            <PromotedActionButton icon="bx bx-trash" title={t("promoted_attributes.remove_this_attribute")} />
        </td>
    )
}

function PromotedActionButton({ icon, title }: {
    icon: string,
    title: string })
{
    return (
        <span
            className={clsx("tn-tool-button pointer", icon)}
            title={title}
        />
    )
}
