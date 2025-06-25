import { createGrid, AllCommunityModule, ModuleRegistry, GridOptions } from "ag-grid-community";
import { buildData, type TableData } from "./data.js";
import FNote from "../../../entities/fnote.js";
import getPromotedAttributeInformation from "./parser.js";
import { setLabel } from "../../../services/attributes.js";
import applyHeaderCustomization from "./header-customization.js";
import ViewModeStorage from "../view_mode_storage.js";
import { type StateInfo } from "./storage.js";
import server from "../../../services/server.js";

ModuleRegistry.registerModules([ AllCommunityModule ]);

export default async function renderTable(el: HTMLElement, parentNote: FNote, notes: FNote[], storage: ViewModeStorage<StateInfo>) {
    const info = getPromotedAttributeInformation(parentNote);
    const viewStorage = await storage.restore();
    const initialState = viewStorage?.gridState;

    createGrid(el, {
        ...buildData(info, notes),
        ...setupEditing(),
        initialState,
        async onGridReady(event) {
            applyHeaderCustomization(el, event.api);
        },
        onStateUpdated(event) {
            storage.store({
                gridState: event.api.getState()
            });
        }
    });
}

function setupEditing(): GridOptions<TableData> {
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
            if (name === "title") {
                // TODO: Deduplicate with note_title.
                server.put(`notes/${noteId}/title`, { title: newValue });
            }

            if (name.startsWith("labels.")) {
                const labelName = name.split(".", 2)[1];
                setLabel(noteId, labelName, newValue);
            }
        }
    }
}

