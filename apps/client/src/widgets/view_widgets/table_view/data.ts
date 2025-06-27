import { GridOptions } from "ag-grid-community";
import FNote from "../../../entities/fnote.js";
import type { LabelType } from "../../../services/promoted_attribute_definition_parser.js";

export type TableData = {
    noteId: string;
    title: string;
    labels: Record<string, boolean | string | null>;
};

export interface PromotedAttributeInformation {
    name: string;
    title?: string;
    type?: LabelType;
}

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

export default function getPromotedAttributeInformation(parentNote: FNote) {
    const info: PromotedAttributeInformation[] = [];
    for (const promotedAttribute of parentNote.getPromotedDefinitionAttributes()) {
        if (promotedAttribute.type !== "label") {
            console.warn("Relations are not supported for now");
            continue;
        }

        const def = promotedAttribute.getDefinition();
        if (def.multiplicity !== "single") {
            console.warn("Multiple values are not supported for now");
            continue;
        }

        info.push({
            name: promotedAttribute.name.split(":", 2)[1],
            title: def.promotedAlias,
            type: def.labelType
        })
    }
    return info;
}
