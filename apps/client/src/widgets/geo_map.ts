import type { Map } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import NoteContextAwareWidget from "./note_context_aware_widget.js";

const TPL = /*html*/`\
<div class="geo-map-widget">
    <style>
        .note-detail-geo-map,
        .geo-map-widget,


        .leaflet-top,
        .leaflet-bottom {
            z-index: 900;
        }
    </style>

</div>`;

export type Leaflet = typeof L;
export type InitCallback = (L: Leaflet) => void;

export default class GeoMapWidget extends NoteContextAwareWidget {

    private initCallback?: InitCallback;

    constructor(widgetMode: "type", initCallback?: InitCallback) {
        super();
        this.initCallback = initCallback;
    }

    doRender() {
        this.$widget = $(TPL);

        if (this.initCallback) {
            this.initCallback(L);
        }


    }
}
