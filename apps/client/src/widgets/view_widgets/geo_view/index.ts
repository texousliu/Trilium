import ViewMode, { ViewModeArgs } from "../view_mode.js";
import L from "leaflet";
import type { GPX, LatLng, LeafletMouseEvent, Map, Marker } from "leaflet";
import SpacedUpdate from "../../../services/spaced_update.js";
import { t } from "../../../services/i18n.js";
import processNoteWithMarker, { processNoteWithGpxTrack } from "./markers.js";
import { hasTouchBar } from "../../../services/utils.js";
import toast from "../../../services/toast.js";
import { CommandListenerData, EventData } from "../../../components/app_context.js";
import dialog from "../../../services/dialog.js";
import server from "../../../services/server.js";
import attributes from "../../../services/attributes.js";
import { moveMarker } from "./editing.js";
import link from "../../../services/link.js";

// TODO: Deduplicate
interface CreateChildResponse {
    note: {
        noteId: string;
    };
}

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
export const LOCATION_ATTRIBUTE = "geolocation";
const CHILD_NOTE_ICON = "bx bx-pin";

enum State {
    Normal,
    NewNote
}

export default class GeoView extends ViewMode<MapData> {

    private args: ViewModeArgs;
    private $root: JQuery<HTMLElement>;
    private $container!: JQuery<HTMLElement>;
    private map?: Map;
    private spacedUpdate: SpacedUpdate;
    private _state: State;
    private ignoreNextZoomEvent?: boolean;

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
        this._state = State.Normal;

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
        map.on("click", (e) => this.#onMapClicked(e));

        this.#reloadMarkers();

        if (hasTouchBar) {
            map.on("zoom", () => {
                if (!this.ignoreNextZoomEvent) {
                    this.triggerCommand("refreshTouchBar");
                }

                this.ignoreNextZoomEvent = false;
            });
        }
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
        const notes = await this.parentNote.getChildNotes();
        for (const childNote of notes) {
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

    #changeState(newState: State) {
        this._state = newState;
        this.$container.toggleClass("placing-note", newState === State.NewNote);
        if (hasTouchBar) {
            this.triggerCommand("refreshTouchBar");
        }
    }

    onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">): boolean | void {
        // If any of the children branches are altered.
        if (loadResults.getBranchRows().find((branch) => branch.parentNoteId === this.parentNote.noteId)) {
            this.#reloadMarkers();
            return;
        }

        // If any of note has its location attribute changed.
        // TODO: Should probably filter by parent here as well.
        const attributeRows = loadResults.getAttributeRows();
        if (attributeRows.find((at) => [LOCATION_ATTRIBUTE, "color"].includes(at.name ?? ""))) {
            this.#reloadMarkers();
        }
    }

    async geoMapCreateChildNoteEvent({ ntxId }: EventData<"geoMapCreateChildNote">) {
        toast.showPersistent({
            icon: "plus",
            id: "geo-new-note",
            title: "New note",
            message: t("geo-map.create-child-note-instruction")
        });

        this.#changeState(State.NewNote);

        const globalKeyListener: (this: Window, ev: KeyboardEvent) => any = (e) => {
            if (e.key !== "Escape") {
                return;
            }

            this.#changeState(State.Normal);

            window.removeEventListener("keydown", globalKeyListener);
            toast.closePersistent("geo-new-note");
        };
        window.addEventListener("keydown", globalKeyListener);
    }

    async #onMapClicked(e: LeafletMouseEvent) {
        if (this._state !== State.NewNote) {
            return;
        }

        toast.closePersistent("geo-new-note");
        const title = await dialog.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });

        if (title?.trim()) {
            const { note } = await server.post<CreateChildResponse>(`notes/${this.parentNote.noteId}/children?target=into`, {
                title,
                content: "",
                type: "text"
            });
            attributes.setLabel(note.noteId, "iconClass", CHILD_NOTE_ICON);
            moveMarker(note.noteId, e.latlng);
        }

        this.#changeState(State.Normal);
    }

    openGeoLocationEvent({ noteId, event }: EventData<"openGeoLocation">) {
        const marker = this.currentMarkerData[noteId];
        if (!marker) {
            return;
        }

        const latLng = this.currentMarkerData[noteId].getLatLng();
        const url = `geo:${latLng.lat},${latLng.lng}`;
        link.goToLinkExt(event, url);
    }

    deleteFromMapEvent({ noteId }: EventData<"deleteFromMap">) {
        moveMarker(noteId, null);
    }

    buildTouchBarCommand({ TouchBar }: CommandListenerData<"buildTouchBar">) {
        const map = this.map;
        const that = this;
        if (!map) {
            return;
        }

        return [
            new TouchBar.TouchBarSlider({
                label: "Zoom",
                value: map.getZoom(),
                minValue: map.getMinZoom(),
                maxValue: map.getMaxZoom(),
                change(newValue) {
                    that.ignoreNextZoomEvent = true;
                    map.setZoom(newValue);
                },
            }),
            new TouchBar.TouchBarButton({
                label: "New geo note",
                click: () => this.triggerCommand("geoMapCreateChildNote"),
                enabled: (this._state === State.Normal)
            })
        ];
    }

}
