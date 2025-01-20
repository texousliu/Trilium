import library_loader from "../services/library_loader.js";
import NoteContextAwareWidget from "./note_context_aware_widget.js";

const TPL = `\
<div class="geo-map-widget">
    <style>
        .note-detail-geo-map,
        .geo-map-widget,
        .geo-map-container {
            height: 100%;
            overflow: hidden;
        }
    </style>

    <div class="geo-map-container"></div>
</div>

`

//@ts-nocheck
export default class GeoMapWidget extends NoteContextAwareWidget {

    constructor(widgetMode: "type") {
        super();
    }

    doRender() {
        this.$widget = $(TPL);

        const $container = this.$widget.find(".geo-map-container");

        library_loader.requireLibrary(library_loader.LEAFLET)
            .then(() => {
                const map = L.map($container[0], {

                });

                map.setView([51.505, -0.09], 13);

                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
            });
    }

}
