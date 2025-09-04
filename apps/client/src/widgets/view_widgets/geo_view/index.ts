import ViewMode, { ViewModeArgs } from "../view_mode.js";
import L from "leaflet";
import type { GPX, LatLng, Layer, LeafletMouseEvent, Map, Marker } from "leaflet";
import SpacedUpdate from "../../../services/spaced_update.js";
import { t } from "../../../services/i18n.js";
import processNoteWithMarker, { processNoteWithGpxTrack } from "./markers.js";
import { hasTouchBar } from "../../../services/utils.js";
import toast from "../../../services/toast.js";
import { CommandListenerData, EventData } from "../../../components/app_context.js";
import { createNewNote, moveMarker, setupDragging } from "./editing.js";
import { openMapContextMenu } from "./context_menu.js";
import attributes from "../../../services/attributes.js";
import { DEFAULT_MAP_LAYER_NAME, MAP_LAYERS } from "./map_layer.js";




export default class GeoView extends ViewMode<MapData> {

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
        this.$root = $(TPL);
        this.$container = this.$root.find(".geo-map-container");
        this.spacedUpdate = new SpacedUpdate(() => this.onSave(), 5_000);

        this.currentMarkerData = {};
        this.currentTrackData = {};

        args.$parent.append(this.$root);
    }

    async #onMapInitialized() {
        const map = this.map;
        if (!map) {
            throw new Error(t("geo-map.unable-to-load-map"));
        }

        const isEditable = !this.isReadOnly;

        if (isEditable) {
            setupDragging(this.$container, map, this.parentNote.noteId);
        }

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
        const notes = await this.parentNote.getSubtreeNotes();
        const draggable = !this.isReadOnly;
    }

    #changeState(newState: State) {
        this._state = newState;
        if (hasTouchBar) {
            this.triggerCommand("refreshTouchBar");
        }
    }

    async onEntitiesReloaded({ loadResults }: EventData<"entitiesReloaded">) {
        // If any of the children branches are altered.
        if (loadResults.getBranchRows().find((branch) => branch.parentNoteId === this.parentNote.noteId)) {
            this.#reloadMarkers();
            return;
        }

        // If any of note has its location attribute changed.
        // TODO: Should probably filter by parent here as well.
        const attributeRows = loadResults.getAttributeRows();
        if (attributeRows.find((at) => [LOCATION_ATTRIBUTE, "color", "iconClass"].includes(at.name ?? ""))) {
            this.#reloadMarkers();
        }

        // Full reload if map layer is changed.
        if (loadResults.getAttributeRows().some(attr => (attr.name?.startsWith("map:") && attributes.isAffecting(attr, this.parentNote)))) {
            return true;
        }
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

