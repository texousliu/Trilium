import { MutableRef, useEffect, useRef, useState } from "preact/hooks";
import "./PromotedAttributes.css";
import { useNoteContext, useNoteLabel, useUniqueName } from "./react/hooks";
import { Attribute } from "../services/attribute_parser";
import FAttribute from "../entities/fattribute";
import clsx from "clsx";
import { t } from "../services/i18n";
import { DefinitionObject } from "../services/promoted_attribute_definition_parser";
import server from "../services/server";
import FNote from "../entities/fnote";

interface Cell {
    definitionAttr: FAttribute;
    definition: DefinitionObject;
    valueAttr: Attribute;
    valueName: string;
}

interface CellProps {
    note: FNote;
    componentId: string;
    cell: Cell,
    cells: Cell[],
    shouldFocus: boolean;
    setCells(cells: Cell[]): void;
    setCellToFocus(cell: Cell): void;
}

export default function PromotedAttributes() {
    const { note, componentId } = useNoteContext();
    const [ cells, setCells ] = useState<Cell[]>();
    const [ viewType ] = useNoteLabel(note, "viewType");
    const [ cellToFocus, setCellToFocus ] = useState<Cell>();

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
                {note && cells?.map(cell => <PromotedAttributeCell
                    cell={cell}
                    cells={cells} setCells={setCells}
                    shouldFocus={cell === cellToFocus} setCellToFocus={setCellToFocus}
                    componentId={componentId} note={note}
                />)}
            </div>
        </div>
    );
}

function PromotedAttributeCell(props: CellProps) {
    const { valueName, valueAttr, definition, definitionAttr } = props.cell;
    const inputId = useUniqueName(`value-${valueAttr.name}`);

    useEffect(() => {
        if (!props.shouldFocus) return;
        const inputEl = document.getElementById(inputId);
        if (inputEl) {
            inputEl.focus();
        }
    }, [ props.shouldFocus ]);

    return (
        <div className="promoted-attribute-cell">
            <label for={inputId}>{definition.promotedAlias ?? valueName}</label>
            <div className="input-group">
                <input
                    tabIndex={200 + definitionAttr.position}
                    id={inputId}
                />
            </div>
            <ActionCell />
            <MultiplicityCell {...props} />
        </div>
    )
}

function ActionCell() {
    return (
        <div>

        </div>
    )
}

function MultiplicityCell({ cell, cells, setCells, setCellToFocus, note, componentId }: CellProps) {
    return (cell.definition.multiplicity === "multi" &&
        <td className="multiplicity">
            <PromotedActionButton
                icon="bx bx-plus"
                title={t("promoted_attributes.add_new_attribute")}
                onClick={() => {
                    const index = cells.indexOf(cell);
                    const newCell: Cell = {
                        ...cell,
                        valueAttr: {
                            attributeId: "",
                            type: cell.valueAttr.type,
                            name: cell.valueName,
                            value: ""
                        }
                    };
                    setCells([
                        ...cells.slice(0, index + 1),
                        newCell,
                        ...cells.slice(index + 1)
                    ]);
                    setCellToFocus(newCell);
                }}
            />{' '}
            <PromotedActionButton
                icon="bx bx-trash"
                title={t("promoted_attributes.remove_this_attribute")}
                onClick={async () => {
                    // Remove the attribute from the server if it exists.
                    const { attributeId, type } = cell.valueAttr;
                    const valueName = cell.valueName;
                    if (attributeId) {
                        await server.remove(`notes/${note.noteId}/attributes/${attributeId}`, componentId);
                    }

                    const index = cells.indexOf(cell);
                    const isLastOneOfType = cells.filter(c => c.valueAttr.type === type && c.valueAttr.name === valueName).length < 2;
                    const newOnesToInsert: Cell[] = [];
                    if (isLastOneOfType) {
                        newOnesToInsert.push({
                            ...cell,
                            valueAttr: {
                                attributeId: "",
                                type: cell.valueAttr.type,
                                name: cell.valueName,
                                value: ""
                            }
                        })
                    }
                    console.log("Delete at ", index, isLastOneOfType);
                    setCells(cells.toSpliced(index, 1, ...newOnesToInsert));
                }}
            />
        </td>
    )
}

function PromotedActionButton({ icon, title, onClick }: {
    icon: string,
    title: string,
    onClick: () => void
})
{
    return (
        <span
            className={clsx("tn-tool-button pointer", icon)}
            title={title}
            onClick={onClick}
        />
    )
}
