import ViewMode, { ViewModeArgs } from "../view_mode.js";
import L from "leaflet";

const TPL = /*html*/`
<div class="geo-view">
    <style>
        .geo-view {
            overflow: hidden;
            position: relative;
            height: 100%;
        }

        .geo-map-container {
            height: 100%;
            overflow: hidden;
        }
    </style>

    <div class="geo-map-container"></div>
</div>`;

export default class GeoView extends ViewMode<{}> {

    private $root: JQuery<HTMLElement>;
    private $container!: JQuery<HTMLElement>;
    private map?: L.Map;

    constructor(args: ViewModeArgs) {
        super(args, "geoMap");
        this.$root = $(TPL);
        this.$container = this.$root.find(".geo-map-container");
        args.$parent.append(this.$root);
    }

    async renderList() {
        this.renderMap();
        return this.$root;
    }

    async renderMap() {
        const map = L.map(this.$container[0], {
            worldCopyJump: true
        });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            detectRetina: true
        }).addTo(map);

        this.map = map;
    }

    get isFullHeight(): boolean {
        return true;
    }

}
