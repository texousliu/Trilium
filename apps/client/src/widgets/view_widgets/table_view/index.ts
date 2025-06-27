import froca from "../../../services/froca.js";
import ViewMode, { type ViewModeArgs } from "../view_mode.js";
import { createGrid, AllCommunityModule, ModuleRegistry, GridOptions } from "ag-grid-community";
import attributes, { setLabel } from "../../../services/attributes.js";
import getPromotedAttributeInformation, { buildColumnDefinitions, buildData, TableData } from "./data.js";
import applyHeaderCustomization from "./header-customization.js";
import server from "../../../services/server.js";
import type { GridApi, GridState } from "ag-grid-community";
import SpacedUpdate from "../../../services/spaced_update.js";
import branches from "../../../services/branches.js";
import type { CommandListenerData, EventData } from "../../../components/app_context.js";
import type { Attribute } from "../../../services/attribute_parser.js";

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

    <div class="header">
        <button data-trigger-command="addNoteListItem">Add new column</button>
    </div>

    <div class="table-view-container"></div>
</div>
`;

export interface StateInfo {
    gridState: GridState;
}

export default class TableView extends ViewMode<StateInfo> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;
    private args: ViewModeArgs;
    private spacedUpdate: SpacedUpdate;
    private api?: GridApi;
    private newAttribute?: Attribute;

    constructor(args: ViewModeArgs) {
        super(args, "table");

        this.$root = $(TPL);
        this.$container = this.$root.find(".table-view-container");
        this.args = args;
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);
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
        const viewStorage = await this.viewStorage.restore();
        const initialState = viewStorage?.gridState;

        const options: GridOptions<TableData> = {
            ...this.setupEditing(),
            ...this.setupDragging(),
            initialState,
            async onGridReady(event) {
                applyHeaderCustomization(el, event.api);
            },
            onStateUpdated: () => this.spacedUpdate.scheduleUpdate()
        }

        this.api = createGrid(el, options);
        this.loadData();
    }

    private async loadData() {
        const notes = await froca.getNotes(this.args.noteIds);
        const info = getPromotedAttributeInformation(this.parentNote);

        this.api?.updateGridOptions({
           ...buildData(this.parentNote, info, notes)
        });
    }

    private onSave() {
        if (!this.api) {
            return;
        }

        this.viewStorage.store({
            gridState: this.api.getState()
        });
    }

    private setupEditing(): GridOptions<TableData> {
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

    private setupDragging() {
        if (this.parentNote.hasLabel("sorted")) {
            return {};
        }

        const config: GridOptions<TableData> = {
            rowDragEntireRow: true,
            onRowDragEnd(e) {
                const fromIndex = e.node.rowIndex;
                const toIndex = e.overNode?.rowIndex;
                if (fromIndex === null || toIndex === null || toIndex === undefined || fromIndex === toIndex) {
                    return;
                }

                const isBelow = (toIndex > fromIndex);
                const fromBranchId = e.node.data?.branchId;
                const toBranchId = e.overNode?.data?.branchId;
                if (fromBranchId === undefined || toBranchId === undefined) {
                    return;
                }

                if (isBelow) {
                    branches.moveAfterBranch([ fromBranchId ], toBranchId);
                } else {
                    branches.moveBeforeBranch([ fromBranchId ], toBranchId);
                }
            }
        };
        return config;
    }

    async reloadAttributesCommand() {
        console.log("Reload attributes");
    }

    async updateAttributeListCommand({ attributes }: CommandListenerData<"updateAttributeList">) {
        this.newAttribute = attributes[0];
    }

    async saveAttributesCommand() {
        if (!this.newAttribute) {
            return;
        }

        const { name, value } = this.newAttribute;
        attributes.addLabel(this.parentNote.noteId, name, value, true);
        console.log("Save attributes", this.newAttribute);
    }

    onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">): boolean | void {
        // Refresh if promoted attributes get changed.
        if (loadResults.getAttributeRows().find(attr =>
            attr.type === "label" &&
            attr.name?.startsWith("label:") &&
            attributes.isAffecting(attr, this.parentNote))) {
            const info = getPromotedAttributeInformation(this.parentNote);
            const columnDefs = buildColumnDefinitions(info);
            this.api?.updateGridOptions({
                columnDefs
            })
        }

        return false;
    }

}

