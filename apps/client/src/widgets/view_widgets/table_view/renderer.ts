import { createGrid, AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { buildData } from "./data.js";
import FNote from "../../../entities/fnote.js";

ModuleRegistry.registerModules([ AllCommunityModule ]);

export default function renderTable(el: HTMLElement, parentNote: FNote, notes: FNote[]) {
    createGrid(el, {
        ...buildData(parentNote, notes)
    });
}
