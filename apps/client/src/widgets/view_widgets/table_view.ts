import renderTable from "./table_view/renderer";
import ViewMode, { ViewModeArgs } from "./view_mode";

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
    </style>

    <div class="table-view-container">
        <p>Table view goes here.</p>
    </div>
</div>
`;

export default class TableView extends ViewMode {

    private $root: JQuery<HTMLElement>;
    private $container: JQuery<HTMLElement>;

    constructor(args: ViewModeArgs) {
        super(args);

        this.$root = $(TPL);
        this.$container = this.$root.find(".table-view-container");
        args.$parent.append(this.$root);
    }

    get isFullHeight(): boolean {
        return true;
    }

    async renderList() {
        this.$container.empty();
        renderTable(this.$container[0]);
        return this.$root;
    }

}
