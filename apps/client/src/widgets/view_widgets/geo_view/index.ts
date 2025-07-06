import ViewMode, { ViewModeArgs } from "../view_mode.js";
import L from "leaflet";
import type { LatLng, Map } from "leaflet";

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

interface MapData {
    view?: {
        center?: LatLng | [number, number];
        zoom?: number;
    };
}

const DEFAULT_COORDINATES: [number, number] = [3.878638227135724, 446.6630455551659];
const DEFAULT_ZOOM = 2;

export default class GeoView extends ViewMode<MapData> {

    private $root: JQuery<HTMLElement>;
    private $container!: JQuery<HTMLElement>;
    private map?: Map;

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

        this.#onMapInitialized();
    }

    async #onMapInitialized() {
        this.#restoreViewportAndZoom();
    }

    async #restoreViewportAndZoom() {
        const map = this.map;
        if (!map) {
            return;
        }

        const parsedContent = await this.viewStorage.restore();

        // Restore viewport position & zoom
        const center = parsedContent?.view?.center ?? DEFAULT_COORDINATES;
        const zoom = parsedContent?.view?.zoom ?? DEFAULT_ZOOM;
        map.setView(center, zoom);
    }

    get isFullHeight(): boolean {
        return true;
    }

}
