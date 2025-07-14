import froca from "../../../services/froca.js";
import ViewMode, { type ViewModeArgs } from "../view_mode.js";
import attributes, { setAttribute, setLabel } from "../../../services/attributes.js";
import server from "../../../services/server.js";
import SpacedUpdate from "../../../services/spaced_update.js";
import type { CommandListenerData, EventData } from "../../../components/app_context.js";
import type { Attribute } from "../../../services/attribute_parser.js";
import note_create, { CreateNoteOpts } from "../../../services/note_create.js";
import {Tabulator, SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, ColumnDefinition, DataTreeModule, Options, RowComponent} from 'tabulator-tables';
import "tabulator-tables/dist/css/tabulator.css";
import "../../../../src/stylesheets/table.css";
import { canReorderRows, configureReorderingRows } from "./dragging.js";
import buildFooter from "./footer.js";
import getAttributeDefinitionInformation, { buildRowDefinitions, TableData } from "./rows.js";
import { AttributeDefinitionInformation, buildColumnDefinitions } from "./columns.js";
import { setupContextMenu } from "./context_menu.js";

const TPL = /*html*/`
<div class="table-view">
    <style>
    .table-view {
        overflow: hidden;
        position: relative;
        height: 100%;
        user-select: none;
        padding: 0 5px 0 10px;
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

    .tabulator-cell .autocomplete {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        outline: none !important;
    }

    .tabulator .tabulator-header {
        border-top: unset;
        border-bottom-width: 1px;
    }

    .tabulator .tabulator-header .tabulator-frozen.tabulator-frozen-left,
    .tabulator-row .tabulator-cell.tabulator-frozen.tabulator-frozen-left {
        border-right-width: 1px;
    }

    .tabulator .tabulator-footer {
        background-color: unset;
        padding: 5px 0;
    }

    .tabulator .tabulator-footer .tabulator-footer-contents {
        justify-content: left;
        gap: 0.5em;
    }

    .tabulator button.tree-expand,
    .tabulator button.tree-collapse {
        display: inline-block;
        appearance: none;
        border: 0;
        background: transparent;
        width: 1.5em;
        position: relative;
        vertical-align: middle;
    }

    .tabulator button.tree-expand span,
    .tabulator button.tree-collapse span {
        position: absolute;
        top: 0;
        left: 0;
        font-size: 1.5em;
        transform: translateY(-50%);
    }
    </style>

    <div class="table-view-container"></div>
</div>
`;

export interface StateInfo {
    tableData?: {
        columns?: ColumnDefinition[];
    };
}

export default class TableView extends ViewMode<StateInfo> {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;
    private args: ViewModeArgs;
    private spacedUpdate: SpacedUpdate;
    private api?: Tabulator;
    private newAttribute?: Attribute;
    private persistentData: StateInfo["tableData"];

    constructor(args: ViewModeArgs) {
        super(args, "table");

        this.$root = $(TPL);
        this.$container = this.$root.find(".table-view-container");
        this.args = args;
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);
        this.persistentData = {};
        args.$parent.append(this.$root);
    }

    async renderList() {
        this.$container.empty();
        this.renderTable(this.$container[0]);
        return this.$root;
    }

    private async renderTable(el: HTMLElement) {
        const info = getAttributeDefinitionInformation(this.parentNote);
        const modules = [ SortModule, FormatModule, InteractionModule, EditModule, ResizeColumnsModule, FrozenColumnsModule, PersistenceModule, MoveColumnsModule, MoveRowsModule, DataTreeModule ];
        for (const module of modules) {
            Tabulator.registerModule(module);
        }

        this.initialize(el, info);
    }

    private async initialize(el: HTMLElement, info: AttributeDefinitionInformation[]) {
        const viewStorage = await this.viewStorage.restore();
        this.persistentData = viewStorage?.tableData || {};

        const { definitions: rowData, hasChildren } = await buildRowDefinitions(this.parentNote, info);
        const movableRows = canReorderRows(this.parentNote) && !hasChildren;
        const columnDefs = buildColumnDefinitions(info, movableRows);
        let opts: Options = {
            layout: "fitDataFill",
            index: "branchId",
            columns: columnDefs,
            data: rowData,
            persistence: true,
            movableColumns: true,
            movableRows,
            footerElement: buildFooter(this.parentNote),
            persistenceWriterFunc: (_id, type: string, data: object) => {
                (this.persistentData as Record<string, {}>)[type] = data;
                this.spacedUpdate.scheduleUpdate();
            },
            persistenceReaderFunc: (_id, type: string) => this.persistentData?.[type],
        };

        if (hasChildren) {
            opts = {
                ...opts,
                dataTree: hasChildren,
                dataTreeElementColumn: "title",
                dataTreeExpandElement: `<button class="tree-expand"><span class="bx bx-chevron-right"></span></button>`,
                dataTreeCollapseElement: `<button class="tree-collapse"><span class="bx bx-chevron-down"></span></button>`
            }
        }

        this.api = new Tabulator(el, opts);
        if (movableRows) {
            configureReorderingRows(this.api);
        }
        setupContextMenu(this.api, this.parentNote);
        this.setupEditing();
    }

    private onSave() {
        this.viewStorage.store({
            tableData: this.persistentData,
        });
    }

    private setupEditing() {
        this.api!.on("cellEdited", async (cell) => {
            const noteId = cell.getRow().getData().noteId;
            const field = cell.getField();
            let newValue = cell.getValue();

            if (field === "title") {
                server.put(`notes/${noteId}/title`, { title: newValue });
                return;
            }

            if (field.includes(".")) {
                const [ type, name ] = field.split(".", 2);
                if (type === "labels") {
                    if (typeof newValue === "boolean") {
                        newValue = newValue ? "true" : "false";
                    }
                    setLabel(noteId, name, newValue);
                } else if (type === "relations") {
                    const note = await froca.getNote(noteId);
                    if (note) {
                        setAttribute(note, "relation", name, newValue);
                    }
                }
            }
        });
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

    addNewRowCommand({ customOpts, parentNotePath: customNotePath }: CommandListenerData<"addNewRow">) {
        const parentNotePath = customNotePath ?? this.args.parentNotePath;
        if (parentNotePath) {
            const opts: CreateNoteOpts = {
                activate: false,
                ...customOpts
            }
            note_create.createNote(parentNotePath, opts).then(({ branch }) => {
                if (branch) {
                    setTimeout(() => {
                        this.focusOnBranch(branch?.branchId);
                    });
                }
            })
        }
    }

    onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">): boolean | void {
        if (!this.api) {
            return;
        }

        // Refresh if promoted attributes get changed.
        if (loadResults.getAttributeRows().find(attr =>
            attr.type === "label" &&
            (attr.name?.startsWith("label:") || attr.name?.startsWith("relation:")) &&
            attributes.isAffecting(attr, this.parentNote))) {
            this.#manageColumnUpdate();
        }

        if (loadResults.getBranchRows().some(branch => branch.parentNoteId === this.parentNote.noteId || this.args.noteIds.includes(branch.parentNoteId ?? ""))
            || loadResults.getNoteIds().some(noteId => this.args.noteIds.includes(noteId)
            || loadResults.getAttributeRows().some(attr => this.args.noteIds.includes(attr.noteId!)))) {
            this.#manageRowsUpdate();
        }

        return false;
    }

    #manageColumnUpdate() {
        if (!this.api) {
            return;
        }

        const info = getAttributeDefinitionInformation(this.parentNote);
        const columnDefs = buildColumnDefinitions(info, !!this.api.options.movableRows, this.persistentData?.columns);
        this.api.setColumns(columnDefs);
    }

    async #manageRowsUpdate() {
        if (!this.api) {
            return;
        }

        const info = getAttributeDefinitionInformation(this.parentNote);
        const { definitions } = await buildRowDefinitions(this.parentNote, info);
        await this.api.replaceData(definitions);
    }

    focusOnBranch(branchId: string) {
        if (!this.api) {
            return;
        }

        const row = findRowDataById(this.api.getRows(), branchId);
        if (!row) {
            return;
        }

        // Expand the parent tree if any.
        if (this.api.options.dataTree) {
            const parent = row.getTreeParent();
            if (parent) {
                parent.treeExpand();
            }
        }

        row.getCell("title").edit();
    }

}


function findRowDataById(rows: RowComponent[], branchId: string): RowComponent | null {
    for (let row of rows) {
        const item = row.getIndex() as string;

        if (item === branchId) {
            return row;
        }

        let found = findRowDataById(row.getTreeChildren(), branchId);
        if (found) return found;
    }
    return null;
}
