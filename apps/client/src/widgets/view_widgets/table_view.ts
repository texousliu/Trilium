import ViewMode, { ViewModeArgs } from "./view_mode";

const TPL = /*html*/`
<div class="table-view">
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

    async renderList() {
        return this.$root;
    }

}
