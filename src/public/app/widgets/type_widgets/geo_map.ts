import type FNote from "../../entities/fnote.js";
import GeoMapWidget from "../geo_map.js";
import TypeWidget from "./type_widget.js"

const TPL = `<div class="note-detail-geo-map note-detail-printable"></div>`;

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

    #onMapInitialized() {
        this.geoMapWidget.map?.on("moveend", () => this.spacedUpdate.scheduleUpdate());
    }

    getData(): any {
        const map = this.geoMapWidget.map;
        if (!map) {
            return;
        }

        const data = {
            view: {
                center: map.getBounds().getCenter()
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
