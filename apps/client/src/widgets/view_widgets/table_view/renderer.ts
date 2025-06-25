import { createGrid, AllCommunityModule, ModuleRegistry, columnDropStyleBordered, GridOptions } from "ag-grid-community";
import { buildData, type TableData } from "./data.js";
import FNote from "../../../entities/fnote.js";
import getPromotedAttributeInformation, { PromotedAttributeInformation } from "./parser.js";
import { setLabel } from "../../../services/attributes.js";
import applyHeaderCustomization from "./header-customization.js";

ModuleRegistry.registerModules([ AllCommunityModule ]);

export default function renderTable(el: HTMLElement, parentNote: FNote, notes: FNote[]) {
    const info = getPromotedAttributeInformation(parentNote);

    createGrid(el, {
        ...buildData(info, notes),
        ...setupEditing(info),
        onGridReady(event) {
            applyHeaderCustomization(el, event.api);
        },
    });
}

function setupEditing(info: PromotedAttributeInformation[]): GridOptions<TableData> {
    return {
        onCellValueChanged(event) {
            if (event.type !== "cellValueChanged") {
                return;
            }

            const noteId = event.data.noteId;
            const name = event.colDef.field;
            if (!name) {
                return;
            }

            const { newValue } = event;
            setLabel(noteId, name, newValue);
        }
    }
}
