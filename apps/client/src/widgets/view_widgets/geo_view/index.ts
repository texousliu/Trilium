import ViewMode, { ViewModeArgs } from "../view_mode.js";

const TPL = /*html*/`
<div class="geo-view">
    <style>
        .geo-view {
            overflow: hidden;
            position: relative;
            height: 100%;
        }
    </style>

    Geo View is not implemented yet.
</div>`;

export default class GeoView extends ViewMode<{}> {

    private $root: JQuery<HTMLElement>;

    constructor(args: ViewModeArgs) {
        super(args, "geoMap");
        this.$root = $(TPL);
        args.$parent.append(this.$root);
    }

    async renderList() {
        console.log("Rendered");
        return this.$root;
    }

    get isFullHeight(): boolean {
        return true;
    }

}
