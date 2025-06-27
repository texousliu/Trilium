import froca from "../../services/froca.js";
import type { StateInfo } from "./table_view/storage.js";
import ViewMode, { type ViewModeArgs } from "./view_mode.js";
import { createGrid, AllCommunityModule, ModuleRegistry, GridOptions } from "ag-grid-community";
import { setLabel } from "../../services/attributes.js";
import getPromotedAttributeInformation from "./table_view/parser.js";
import { buildData, TableData } from "./table_view/data.js";
import applyHeaderCustomization from "./table_view/header-customization.js";
import server from "../../services/server.js";

const TPL = /*html*/`
<div class="table-view">
    <style>
    .table-view {
        overflow: hidden;
        position: relative;
        height: 100%;
        user-select: none;
        padding: 10px;
    }

    .table-view-container {
        height: 100%;
    }

    .search-result-widget-content .table-view {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }
    </style>

    <div class="table-view-container"></div>
</div>
`;

export default class TableView extends ViewMode<StateInfo> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;
    private args: ViewModeArgs;

    constructor(args: ViewModeArgs) {
        super(args, "table");

        this.$root = $(TPL);
        this.$container = this.$root.find(".table-view-container");
        this.args = args;
        args.$parent.append(this.$root);

        ModuleRegistry.registerModules([ AllCommunityModule ]);
    }

    get isFullHeight(): boolean {
        return true;
    }

    async renderList() {
        this.$container.empty();
        this.renderTable(this.$container[0]);
        return this.$root;
    }

    private async renderTable(el: HTMLElement) {
        const { noteIds, parentNote } = this.args;
        const notes = await froca.getNotes(noteIds);

        const info = getPromotedAttributeInformation(parentNote);
        const viewStorage = await this.viewStorage.restore();
        const initialState = viewStorage?.gridState;

        createGrid(el, {
            ...buildData(info, notes),
            ...setupEditing(),
            initialState,
            async onGridReady(event) {
                applyHeaderCustomization(el, event.api);
            },
            onStateUpdated: (event) => this.viewStorage.store({
                gridState: event.api.getState()
            })
        });
    }

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
