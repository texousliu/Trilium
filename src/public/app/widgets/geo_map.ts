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

export default class GeoMapWidget extends NoteContextAwareWidget {

    constructor(widgetMode: "type") {
        super();
    }

    doRender() {
        this.$widget = $(TPL);

        const $container = this.$widget.find(".geo-map-container");

        library_loader.requireLibrary(library_loader.LEAFLET)
            .then(() => {
                //@ts-ignore
                L.map($container[0], {

                });
            });
    }

}
