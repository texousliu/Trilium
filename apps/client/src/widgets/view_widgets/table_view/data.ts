import { GridOptions } from "ag-grid-community";
import FNote from "../../../entities/fnote";
import type { LabelType } from "../../../services/promoted_attribute_definition_parser.js";

type Data = {
    title: string;
} & Record<string, string>;

type GridLabelType = 'text' | 'number' | 'boolean' | 'date' | 'dateString' | 'object';

export function buildData(parentNote: FNote, notes: FNote[]) {
    const { columnDefs, expectedLabels } = buildColumnDefinitions(parentNote);
    const rowData = buildRowDefinitions(notes, expectedLabels);

    return {
        rowData,
        columnDefs
    }
}

export function buildColumnDefinitions(parentNote: FNote) {
    const columnDefs: GridOptions<Data>["columnDefs"] = [
        {
            field: "title"
        }
    ];

    const expectedLabels: string[] = [];

    for (const promotedAttribute of parentNote.getPromotedDefinitionAttributes()) {
        console.log(promotedAttribute);
        if (promotedAttribute.type !== "label") {
            console.warn("Relations are not supported for now");
            continue;
        }

        const def = promotedAttribute.getDefinition();
        if (def.multiplicity !== "single") {
            console.warn("Multiple values are not supported for now");
            continue;
        }

        const attributeName = promotedAttribute.name.split(":", 2)[1];
        const title = def.promotedAlias ?? attributeName;

        columnDefs.push({
            field: attributeName,
            headerName: title,
            cellDataType: mapDataType(def.labelType)
        });
        expectedLabels.push(attributeName);
    }

    return { columnDefs, expectedLabels };
}

function mapDataType(labelType: LabelType | undefined): GridLabelType {
    if (!labelType) {
        return "text";
    }

    switch (labelType) {
        case "date":
            return "dateString";
        case "text":
        default:
            return "text"
    }
}

export function buildRowDefinitions(notes: FNote[], expectedLabels: string[]): GridOptions<Data>["rowData"] {
    const definitions: GridOptions<Data>["rowData"] = [];
    for (const note of notes) {
        const data = {
            title: note.title
        };

        for (const expectedLabel of expectedLabels) {
            data[expectedLabel] = note.getLabelValue(expectedLabel);
        }

        definitions.push(data);
    }

    return definitions;
}
