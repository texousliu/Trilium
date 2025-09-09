import ViewMode, { type ViewModeArgs } from "../view_mode.js";
import attributes from "../../../services/attributes.js";
import SpacedUpdate from "../../../services/spaced_update.js";
import type { EventData } from "../../../components/app_context.js";

import buildFooter from "./footer.js";
import getAttributeDefinitionInformation, { buildRowDefinitions } from "./rows.js";
import { AttributeDefinitionInformation, buildColumnDefinitions } from "./columns.js";
import { setupContextMenu } from "./context_menu.js";
import TableColumnEditing from "./col_editing.js";
import TableRowEditing from "./row_editing.js";

const TPL = /*html*/`
    <style>

    </style>
`;

export interface StateInfo {

}

export default class TableView extends ViewMode<StateInfo> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;
    private spacedUpdate: SpacedUpdate;
    private api?: Tabulator;
    private persistentData: StateInfo["tableData"];
    private colEditing?: TableColumnEditing;
    private rowEditing?: TableRowEditing;
    private maxDepth: number = -1;
    private rowNumberHint: number = 1;

    constructor(args: ViewModeArgs) {
        super(args, "table");

        this.$root = $(TPL);
        this.$container = this.$root.find(".table-view-container");
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);
        this.persistentData = {};
        args.$parent.append(this.$root);
    }

    async renderList() {
        this.$container.empty();
        this.renderTable(this.$container[0]);
        return this.$root;
    }

    private async initialize(el: HTMLElement, info: AttributeDefinitionInformation[]) {
        const viewStorage = await this.viewStorage.restore();
        this.persistentData = viewStorage?.tableData || {};

        this.api = new Tabulator(el, opts);

        this.colEditing = new TableColumnEditing(this.args.$parent, this.args.parentNote, this.api);
        this.rowEditing = new TableRowEditing(this.api, this.args.parentNotePath!);

        setupContextMenu(this.api, this.parentNote);
    }

    async onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">) {
        if (loadResults.getBranchRows().some(branch => branch.parentNoteId === this.parentNote.noteId || this.noteIds.includes(branch.parentNoteId ?? ""))
            || loadResults.getNoteIds().some(noteId => this.noteIds.includes(noteId))
            || loadResults.getAttributeRows().some(attr => this.noteIds.includes(attr.noteId!))) {
            return await this.#manageRowsUpdate();
        }

        return false;
    }

    #manageColumnUpdate() {
        if (!this.api) {
            return;
        }

        const info = getAttributeDefinitionInformation(this.parentNote);
        const columnDefs = buildColumnDefinitions({
            info,
            movableRows: !!this.api.options.movableRows,
            existingColumnData: this.persistentData?.columns,
            rowNumberHint: this.rowNumberHint,
            position: this.colEditing?.getNewAttributePosition()
        });
        this.api.setColumns(columnDefs);
        this.colEditing?.resetNewAttributePosition();
    }

    deleteTableColumnCommand(e) { this.colEditing?.deleteTableColumnCommand(e); }

    async #manageRowsUpdate() {
        if (!this.api) {
            return;
        }

        const info = getAttributeDefinitionInformation(this.parentNote);
        const { definitions, hasSubtree, rowNumber } = await buildRowDefinitions(this.parentNote, info, this.maxDepth);
        this.rowNumberHint = rowNumber;

        // Force a refresh if the data tree needs enabling/disabling.
        if (this.api.options.dataTree !== hasSubtree) {
            return true;
        }

        await this.api.replaceData(definitions);
        return false;
    }

}

