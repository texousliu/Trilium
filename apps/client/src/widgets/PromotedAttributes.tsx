import { MutableRef, useEffect, useRef, useState } from "preact/hooks";
import "./PromotedAttributes.css";
import { useNoteContext, useNoteLabel, useUniqueName } from "./react/hooks";
import { Attribute } from "../services/attribute_parser";
import FAttribute from "../entities/fattribute";
import clsx from "clsx";
import { t } from "../services/i18n";
import { DefinitionObject, LabelType } from "../services/promoted_attribute_definition_parser";
import server from "../services/server";
import FNote from "../entities/fnote";
import { HTMLInputTypeAttribute, InputHTMLAttributes, TargetedEvent, TargetedInputEvent } from "preact";
import tree from "../services/tree";

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

// TODO: Deduplicate
interface AttributeResult {
    attributeId: string;
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

                // if not owned, we'll force creation of a new attribute instead of updating the inherited one
                if (valueAttr.noteId !== note.noteId) {
                    valueAttr.attributeId = "";
                }

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
    const { valueName, valueAttr, definition } = props.cell;
    const inputId = useUniqueName(`value-${valueAttr.name}`);

    useEffect(() => {
        if (!props.shouldFocus) return;
        const inputEl = document.getElementById(inputId);
        if (inputEl) {
            inputEl.focus();
        }
    }, [ props.shouldFocus ]);

    return (
        <div className={clsx("promoted-attribute-cell",
            valueAttr.type === "label" ? `promoted-attribute-label-${definition.labelType}` : "promoted-attribute-relation")}>
            <label for={inputId}>{definition.promotedAlias ?? valueName}</label>{' '}
            <div className="input-group">
                <LabelInput inputId={inputId} {...props} />
            </div>
            <ActionCell />
            <MultiplicityCell {...props} />
        </div>
    )
}

const LABEL_MAPPINGS: Record<LabelType, HTMLInputTypeAttribute> = {
    text: "text",
    number: "number",
    boolean: "checkbox",
    date: "date",
    datetime: "datetime-local",
    time: "time",
    color: "hidden", // handled separately.
    url: "url"
};

function LabelInput({ inputId, ...props }: CellProps & { inputId: string }) {
    const { valueAttr, definition, definitionAttr } = props.cell;
    const onChangeListener = buildPromotedAttributeChangedListener({...props});
    const extraInputProps: InputHTMLAttributes = {};

    useEffect(() => {
        if (definition.labelType === "text") {
            const el = document.getElementById(inputId);
            if (el) {
                setupTextLabelAutocomplete(el as HTMLInputElement, valueAttr, onChangeListener);
            }
        }
    }, []);

    if (definition.labelType === "number") {
        let step = 1;
        for (let i = 0; i < (definition.numberPrecision || 0) && i < 10; i++) {
            step /= 10;
        }
        extraInputProps.step = step;
    }

    return (
        <>
            <input
                className="form-control promoted-attribute-input"
                tabIndex={200 + definitionAttr.position}
                id={inputId}
                type={LABEL_MAPPINGS[definition.labelType ?? "text"]}
                value={valueAttr.value}
                placeholder={t("promoted_attributes.unset-field-placeholder")}
                data-attribute-id={valueAttr.attributeId}
                data-attribute-type={valueAttr.type}
                data-attribute-name={valueAttr.name}
                onChange={onChangeListener}
                {...extraInputProps}
            />

            { definition.labelType === "color" && <ColorPicker {...props} onChange={onChangeListener} inputId={inputId} />}
        </>
    );
}


// We insert a separate input since the color input does not support empty value.
// This is a workaround to allow clearing the color input.
function ColorPicker({ cell, onChange, inputId }: CellProps & {
    onChange: (e: TargetedEvent<HTMLInputElement, Event>) => Promise<void>,
    inputId: string;
}) {
    const defaultColor = "#ffffff";
    const colorInputRef = useRef<HTMLInputElement>(null);
    return (
        <>
            <input
                ref={colorInputRef}
                className="form-control promoted-attribute-input"
                type="color"
                value={cell.valueAttr.value || defaultColor}
                onChange={onChange}
            />
            <span
                className="input-group-text bx bxs-tag-x"
                title={t("promoted_attributes.remove_color")}
                onClick={(e) => {
                    // Indicate to the user the color was reset.
                    if (colorInputRef.current) {
                        colorInputRef.current.value = defaultColor;
                    }

                    // Trigger the actual attribute change by injecting it into the hidden field.
                    const inputEl = document.getElementById(inputId) as HTMLInputElement | null;
                    if (!inputEl) return;
                    inputEl.value = "";
                    onChange({
                        ...e,
                        target: inputEl
                    } as unknown as TargetedInputEvent<HTMLInputElement>);
                }}
            />
        </>
    )
}

function RelationInput() {

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

function setupTextLabelAutocomplete(el: HTMLInputElement, valueAttr: Attribute, onChangeListener: TargetedEvent<HTMLInputElement, Event>) {
    // no need to await for this, can be done asynchronously
    const $input = $(el);
    server.get<string[]>(`attribute-values/${encodeURIComponent(valueAttr.name)}`).then((_attributeValues) => {
        if (_attributeValues.length === 0) {
            return;
        }

        const attributeValues = _attributeValues.map((attribute) => ({ value: attribute }));

        $input.autocomplete(
            {
                appendTo: document.querySelector("body"),
                hint: false,
                autoselect: false,
                openOnFocus: true,
                minLength: 0,
                tabAutocomplete: false
            },
            [
                {
                    displayKey: "value",
                    source: function (term, cb) {
                        term = term.toLowerCase();

                        const filtered = attributeValues.filter((attr) => attr.value.toLowerCase().includes(term));

                        cb(filtered);
                    }
                }
            ]
        );

        $input.on("autocomplete:selected", onChangeListener);
    });
}

function buildPromotedAttributeChangedListener({ note, cell, componentId }: CellProps) {
    return async (e: TargetedEvent<HTMLInputElement, Event>) => {
        const inputEl = e.target as HTMLInputElement;
        let value: string;

        if (inputEl.type === "checkbox") {
            value = inputEl.checked ? "true" : "false";
        } else if (inputEl.dataset.attributeType === "relation") {
            const selectedPath = $(inputEl).getSelectedNotePath();
            value = selectedPath ? tree.getNoteIdFromUrl(selectedPath) ?? "" : "";
            console.log("Got relation ", value);
        } else {
            value = inputEl.value;
        }

        const result = await server.put<AttributeResult>(
            `notes/${note.noteId}/attribute`,
            {
                attributeId: cell.valueAttr.attributeId,
                type: cell.valueAttr.type,
                name: cell.valueName,
                value: value
            },
            componentId
        );

        cell.valueAttr.attributeId = result.attributeId;
    }
}
