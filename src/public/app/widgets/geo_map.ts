import NoteContextAwareWidget from "./note_context_aware_widget.js";

const TPL = `\
<div class="geo-map-widget">
    Map goes here.
</div>`

export default class GeoMapWidget extends NoteContextAwareWidget {

    constructor(widgetMode: "type") {
        super();
    }

    doRender() {
        this.$widget = $(TPL)
    }

}
