import ViewMode, { ViewModeArgs } from "../view_mode.js";
import L from "leaflet";
import type { GPX, LatLng, Map, Marker } from "leaflet";
import SpacedUpdate from "../../../services/spaced_update.js";
import { t } from "../../../services/i18n.js";
import processNoteWithMarker, { processNoteWithGpxTrack } from "./markers.js";
import froca from "../../../services/froca.js";

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

        .leaflet-pane {
            z-index: 1;
        }

        .geo-map-container.placing-note {
            cursor: crosshair;
        }

        .geo-map-container .marker-pin {
            position: relative;
        }

        .geo-map-container .leaflet-div-icon {
            position: relative;
            background: transparent;
            border: 0;
            overflow: visible;
        }

        .geo-map-container .leaflet-div-icon .icon-shadow {
            position: absolute;
            top: 0;
            left: 0;
            z-index: -1;
        }

        .geo-map-container .leaflet-div-icon .bx {
            position: absolute;
            top: 3px;
            left: 2px;
            background-color: white;
            color: black;
            padding: 2px;
            border-radius: 50%;
            font-size: 17px;
        }

        .geo-map-container .leaflet-div-icon .title-label {
            display: block;
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.75rem;
            height: 1rem;
            color: black;
            width: 100px;
            text-align: center;
            text-overflow: ellipsis;
            text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;
            white-space: no-wrap;
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
const LOCATION_ATTRIBUTE = "geolocation";
const CHILD_NOTE_ICON = "bx bx-pin";

export default class GeoView extends ViewMode<MapData> {

    private args: ViewModeArgs;
    private $root: JQuery<HTMLElement>;
    private $container!: JQuery<HTMLElement>;
    private map?: Map;
    private spacedUpdate: SpacedUpdate;

    private currentMarkerData: Record<string, Marker>;
    private currentTrackData: Record<string, GPX>;

    constructor(args: ViewModeArgs) {
        super(args, "geoMap");
        this.args = args;
        this.$root = $(TPL);
        this.$container = this.$root.find(".geo-map-container");
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);

        this.currentMarkerData = {};
        this.currentTrackData = {};

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

        this.#reloadMarkers();
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

    async #reloadMarkers() {
        if (!this.map) {
            return;
        }

        // Delete all existing markers
        for (const marker of Object.values(this.currentMarkerData)) {
            marker.remove();
        }

        // Delete all existing tracks
        for (const track of Object.values(this.currentTrackData)) {
            track.remove();
        }

        // Add the new markers.
        this.currentMarkerData = {};
        for (const noteId of this.args.noteIds) {
            const childNote = await froca.getNote(noteId);
            if (!childNote) {
                continue;
            }

            if (childNote.mime === "application/gpx+xml") {
                const track = await processNoteWithGpxTrack(this.map, childNote);
                this.currentTrackData[childNote.noteId] = track;
                continue;
            }

            const latLng = childNote.getAttributeValue("label", LOCATION_ATTRIBUTE);
            if (latLng) {
                const marker = processNoteWithMarker(this.map, childNote, latLng);
                this.currentMarkerData[childNote.noteId] = marker;
            }
        }
    }

    get isFullHeight(): boolean {
        return true;
    }

}
