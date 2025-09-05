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

    async #onMapInitialized() {

        if (hasTouchBar) {
            map.on("zoom", () => {
                if (!this.ignoreNextZoomEvent) {
                    this.triggerCommand("refreshTouchBar");
                }

                this.ignoreNextZoomEvent = false;
            });
        }
    }

    #changeState(newState: State) {
        this._state = newState;
        if (hasTouchBar) {
            this.triggerCommand("refreshTouchBar");
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

