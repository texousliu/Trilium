import { GridOptions } from "ag-grid-community";
import FNote from "../../../entities/fnote";

interface Data {
    title: string;
}

export function buildColumnDefinitions(): GridOptions<Data>["columnDefs"] {
    return [
        {
            field: "title"
        }
    ];
}

export function buildRowDefinitions(notes: FNote[]): GridOptions<Data>["rowData"] {
    const definitions: GridOptions<Data>["rowData"] = [];
    for (const note of notes) {
        definitions.push(buildRowDefinition(note));
    }

    return definitions;
}

export function buildRowDefinition(note: FNote): Data {
    return {
        title: note.title
    }
}
