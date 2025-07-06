import { type LatLng, type LeafletMouseEvent } from "leaflet";
import type FNote from "../../entities/fnote.js";
import GeoMapWidget, { type InitCallback, type Leaflet } from "../geo_map.js";
import TypeWidget from "./type_widget.js";
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import dialogService from "../../services/dialog.js";
import type { CommandListenerData, EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import attributes from "../../services/attributes.js";
import link from "../../services/link.js";


const TPL = /*html*/`\
<div class="note-detail-geo-map note-detail-printable">
    <style>

    </style>
</div>`;

const LOCATION_ATTRIBUTE = "geolocation";
const CHILD_NOTE_ICON = "bx bx-pin";

export default class GeoMapTypeWidget extends TypeWidget {

    private geoMapWidget: GeoMapWidget;
    private L!: Leaflet;

    static getType() {
        return "geoMap";
    }

    constructor() {
        super();

        this.geoMapWidget = new GeoMapWidget("type", (L: Leaflet) => this.#onMapInitialized(L));


        this.child(this.geoMapWidget);
    }

    doRender() {
        super.doRender();

        this.$widget = $(TPL);
        this.$widget.append(this.geoMapWidget.render());
    }

    async #onMapInitialized(L: Leaflet) {
        // this.L = L;

        // // This fixes an issue with the map appearing cut off at the beginning, due to the container not being properly attached
        // setTimeout(() => {
        //     map.invalidateSize();
        // }, 100);


    }

    async doRefresh(note: FNote) {
        await this.geoMapWidget.refresh();
        // this.#restoreViewportAndZoom();
        // await this.#reloadMarkers();
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {

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
        // this.moveMarker(noteId, null);
    }

}
