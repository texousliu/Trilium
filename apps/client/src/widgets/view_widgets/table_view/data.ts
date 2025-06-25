import { GridOptions } from "ag-grid-community";
import FNote from "../../../entities/fnote.js";
import type { LabelType } from "../../../services/promoted_attribute_definition_parser.js";
import { default as getPromotedAttributeInformation, type PromotedAttributeInformation } from "./parser.js";

export type TableData = {
    noteId: string;
    title: string;
    labels: Record<string, boolean | string | null>;
};


type GridLabelType = 'text' | 'number' | 'boolean' | 'date' | 'dateString' | 'object';

export function buildData(info: PromotedAttributeInformation[], notes: FNote[]) {
    const columnDefs = buildColumnDefinitions(info);
    const rowData = buildRowDefinitions(notes, info);

    return {
        rowData,
        columnDefs
    }
}

export function buildColumnDefinitions(info: PromotedAttributeInformation[]) {
    const columnDefs: GridOptions<TableData>["columnDefs"] = [
        {
            field: "noteId",
            editable: false
        },
        {
            field: "title",
            editable: true
        }
    ];

    for (const { name, title, type } of info) {
        columnDefs.push({
            field: `labels.${name}`,
            headerName: title,
            cellDataType: mapDataType(type),
            editable: true
        });
    }

    return columnDefs;
}

function mapDataType(labelType: LabelType | undefined): GridLabelType {
    if (!labelType) {
        return "text";
    }

    switch (labelType) {
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        case "date":
            return "dateString";
        case "text":
        default:
            return "text"
    }
}

export function buildRowDefinitions(notes: FNote[], infos: PromotedAttributeInformation[]) {
    const definitions: GridOptions<TableData>["rowData"] = [];
    for (const note of notes) {
        const labels: typeof definitions[0]["labels"] = {};
        for (const { name, type } of infos) {
            if (type === "boolean") {
                labels[name] = note.hasLabel(name);
            } else {
                labels[name] = note.getLabelValue(name);
            }
        }
        definitions.push({
            noteId: note.noteId,
            title: note.title,
            labels
        });
    }

    return definitions;
}
