import { GridOptions } from "ag-grid-community";
import FNote from "../../../entities/fnote";
import type { LabelType } from "../../../services/promoted_attribute_definition_parser.js";

type Data = {
    title: string;
} & Record<string, string>;

interface PromotedAttributeInformation {
    name: string;
    title?: string;
    type?: LabelType;
}

type GridLabelType = 'text' | 'number' | 'boolean' | 'date' | 'dateString' | 'object';

export function buildData(parentNote: FNote, notes: FNote[]) {
    const info = getPromotedAttributeInformation(parentNote);
    const columnDefs = buildColumnDefinitions(parentNote, info);
    const rowData = buildRowDefinitions(notes, info);

    return {
        rowData,
        columnDefs
    }
}

export function buildColumnDefinitions(parentNote: FNote, info: PromotedAttributeInformation[]) {
    const columnDefs: GridOptions<Data>["columnDefs"] = [
        {
            field: "title"
        }
    ];

    for (const { name, title, type } of info) {
        columnDefs.push({
            field: name,
            headerName: title,
            cellDataType: mapDataType(type)
        });
    }

    return columnDefs;
}

function getPromotedAttributeInformation(parentNote: FNote) {
    const info: PromotedAttributeInformation[] = [];
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

        info.push({
            name: promotedAttribute.name.split(":", 2)[1],
            title: def.promotedAlias,
            type: def.labelType
        })
    }
    return info;
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

export function buildRowDefinitions(notes: FNote[], infos: PromotedAttributeInformation[]): GridOptions<Data>["rowData"] {
    const definitions: GridOptions<Data>["rowData"] = [];
    for (const note of notes) {
        const data = {
            title: note.title
        };

        for (const info of infos) {
            data[info.name] = note.getLabelValue(info.name);
        }

        definitions.push(data);
    }

    return definitions;
}
