import type { LatLng, LeafletMouseEvent } from "leaflet";
import type FNote from "../../entities/fnote.js";
import GeoMapWidget, { type InitCallback, type Leaflet } from "../geo_map.js";
import TypeWidget from "./type_widget.js"
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import dialogService from "../../services/dialog.js";
import type { EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import attributes from "../../services/attributes.js";

const TPL = `\
<div class="note-detail-geo-map note-detail-printable">
    <style>
        .leaflet-pane {
            z-index: 1;
        }
    </style>
</div>`;

const LOCATION_ATTRIBUTE = "latLng";

interface MapData {
    view?: {
        center?: LatLng | [ number, number ];
        zoom?: number;
    }
}

// TODO: Deduplicate
interface CreateChildResponse {
    note: {
        noteId: string;
    }
}

interface Clipboard {
    noteId: string;
    title: string;
}

export default class GeoMapTypeWidget extends TypeWidget {

    private geoMapWidget: GeoMapWidget;
    private clipboard?: Clipboard;

    static getType() {
        return "geoMap";
    }

    constructor() {
        super();

        this.geoMapWidget = new GeoMapWidget("type", (L: Leaflet) => this.#onMapInitialized(L));

        this.child(this.geoMapWidget);
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.append(this.geoMapWidget.render());

        super.doRender();
    }

    async #onMapInitialized(L: Leaflet) {
        const map = this.geoMapWidget.map;
        if (!map) {
            throw new Error("Unable to load map.");
        }

        if (!this.note) {
            return;
        }

        const blob = await this.note.getBlob();

        let parsedContent: MapData = {};
        if (blob) {
            parsedContent = JSON.parse(blob.content);
        }

        // Restore viewport position & zoom
        const center = parsedContent.view?.center ?? [51.505, -0.09];
        const zoom = parsedContent.view?.zoom ?? 13;
        map.setView(center, zoom);

        // Restore markers.
        const childNotes = await this.note.getChildNotes();
        for (const childNote of childNotes) {
            const latLng = childNote.getAttributeValue("label", LOCATION_ATTRIBUTE);
            if (!latLng) {
                continue;
            }

            const [ lat, lng ] = latLng.split(",", 2).map((el) => parseFloat(el));
            L.marker(L.latLng(lat, lng))
                .addTo(map)
                .bindPopup(childNote.title);
        }

        const updateFn = () => this.spacedUpdate.scheduleUpdate();
        map.on("moveend", updateFn);
        map.on("zoomend", updateFn);
        map.on("click", (e) => this.#onMapClicked(e));
    }

    async #onMapClicked(e: LeafletMouseEvent) {
        if (!this.clipboard) {
            return;
        }

        const { noteId } = this.clipboard;
        await attributes.setLabel(noteId, LOCATION_ATTRIBUTE, [e.latlng.lat, e.latlng.lng].join(","));
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

    async geoMapCreateChildNoteEvent({ ntxId }: EventData<"geoMapCreateChildNote">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        const title = await dialogService.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });

        if (!title?.trim()) {
            return;
        }

        const { note } = await server.post<CreateChildResponse>(`notes/${this.noteId}/children?target=into`, {
            title,
            content: "",
            type: "text"
        });

        toastService.showMessage(t("relation_map.click_on_canvas_to_place_new_note"));

        this.clipboard = { noteId: note.noteId, title };
    }

    async doRefresh(note: FNote) {
        await this.geoMapWidget.refresh();
    }

}
