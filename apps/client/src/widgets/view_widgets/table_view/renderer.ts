import { createGrid, AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { buildColumnDefinitions, buildRowDefinitions } from "./data.js";
import FNote from "../../../entities/fnote.js";

ModuleRegistry.registerModules([ AllCommunityModule ]);

export default function renderTable(el: HTMLElement, notes: FNote[]) {
    const rowData = buildRowDefinitions(notes);

    createGrid(el, {
        // Row Data: The data to be displayed.
        rowData: rowData,
        // Column Definitions: Defines the columns to be displayed.
        columnDefs: buildColumnDefinitions()
    });
}
