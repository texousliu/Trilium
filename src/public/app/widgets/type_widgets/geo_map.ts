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

        this.geoMapWidget = new GeoMapWidget("type");
        this.child(this.geoMapWidget);
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.append(this.geoMapWidget.render());

        super.doRender();
    }

    async doRefresh(note: FNote) {
        await this.geoMapWidget.refresh();
    }

}
