import ViewMode, { ViewModeArgs } from "../view_mode.js";
import L from "leaflet";
import type { LatLng, Map } from "leaflet";
import SpacedUpdate from "../../../services/spaced_update.js";
import { t } from "../../../services/i18n.js";

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
    private spacedUpdate: SpacedUpdate;

    constructor(args: ViewModeArgs) {
        super(args, "geoMap");
        this.$root = $(TPL);
        this.$container = this.$root.find(".geo-map-container");
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);
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
        const map = this.map;
        if (!map) {
            throw new Error(t("geo-map.unable-to-load-map"));
        }

        this.#restoreViewportAndZoom();

        const updateFn = () => this.spacedUpdate.scheduleUpdate();
        map.on("moveend", updateFn);
        map.on("zoomend", updateFn);
        // map.on("click", (e) => this.#onMapClicked(e));
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

    private onSave() {
        const map = this.map;
        let data: MapData = {};
        if (map) {
            data = {
                view: {
                    center: map.getBounds().getCenter(),
                    zoom: map.getZoom()
                }
            };
        }

        this.viewStorage.store(data);
    }

    get isFullHeight(): boolean {
        return true;
    }

}
