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
    </style>

    <p>Table view goes here.</p>
</div>
`;

export default class TableView extends ViewMode {

    private $root: JQuery<HTMLElement>;

    constructor(args: ViewModeArgs) {
        super(args);

        this.$root = $(TPL);
        args.$parent.append(this.$root);
    }

    get isFullHeight(): boolean {
        return true;
    }

    async renderList() {
        return this.$root;
    }

}
