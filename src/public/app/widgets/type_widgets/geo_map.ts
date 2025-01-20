import type { LatLng } from "leaflet";
import type FNote from "../../entities/fnote.js";
import GeoMapWidget from "../geo_map.js";
import TypeWidget from "./type_widget.js"

const TPL = `\
<div class="note-detail-geo-map note-detail-printable">
    <style>
        .leaflet-pane {
            z-index: 1;
        }
    </style>
</div>`;

interface MapData {
    view?: {
        center?: LatLng | [ number, number ];
        zoom?: number;
    }
}

export default class GeoMapTypeWidget extends TypeWidget {

    private geoMapWidget: GeoMapWidget;

    static getType() {
        return "geoMap";
    }

    constructor() {
        super();

        this.geoMapWidget = new GeoMapWidget("type", () => this.#onMapInitialized());

        this.child(this.geoMapWidget);
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.append(this.geoMapWidget.render());

        super.doRender();
    }

    async #onMapInitialized() {
        const map = this.geoMapWidget.map;
        if (!map) {
            throw new Error("Unable to load map.");
        }

        const blob = await this.note?.getBlob();

        let parsedContent: MapData = {};
        if (blob) {
            parsedContent = JSON.parse(blob.content);
        }

        const center = parsedContent.view?.center ?? [51.505, -0.09];
        const zoom = parsedContent.view?.zoom ?? 13;
        map.setView(center, zoom);

        const updateFn = () => this.spacedUpdate.scheduleUpdate();
        map.on("moveend", updateFn);
        map.on("zoomend", updateFn);
    }

    getData(): any {
        const map = this.geoMapWidget.map;
        if (!map) {
            return;
        }

        const data: MapData = {
            view: {
                center: map.getBounds().getCenter(),
                zoom: map.getZoom()
            }
        };

        return {
            content: JSON.stringify(data)
        };
    }

    async doRefresh(note: FNote) {
        await this.geoMapWidget.refresh();
    }

}
