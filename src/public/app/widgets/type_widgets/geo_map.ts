import { Marker, type LatLng, type LeafletMouseEvent } from "leaflet";
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

        .geo-map-container.placing-note {
            cursor: crosshair;
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

type MarkerData = Record<string, Marker>;

export default class GeoMapTypeWidget extends TypeWidget {

    private geoMapWidget: GeoMapWidget;
    private clipboard?: Clipboard;
    private L!: Leaflet;
    private currentMarkerData: MarkerData;

    static getType() {
        return "geoMap";
    }

    constructor() {
        super();

        this.geoMapWidget = new GeoMapWidget("type", (L: Leaflet) => this.#onMapInitialized(L));
        this.currentMarkerData = {};

        this.child(this.geoMapWidget);
    }

    doRender() {
        this.$widget = $(TPL);
        this.$widget.append(this.geoMapWidget.render());

        super.doRender();
    }

    async #onMapInitialized(L: Leaflet) {
        this.L = L;
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
        await this.#reloadMarkers();

        const updateFn = () => this.spacedUpdate.scheduleUpdate();
        map.on("moveend", updateFn);
        map.on("zoomend", updateFn);
        map.on("click", (e) => this.#onMapClicked(e));
    }

    async #reloadMarkers() {
        const map = this.geoMapWidget.map;

        if (!this.note || !map) {
            return;
        }

        // Delete all existing markers
        for (const marker of Object.values(this.currentMarkerData)) {
            marker.remove();
        }

        // Add the new markers.
        this.currentMarkerData = {};
        const childNotes = await this.note.getChildNotes();
        const L = this.L;
        for (const childNote of childNotes) {
            const latLng = childNote.getAttributeValue("label", LOCATION_ATTRIBUTE);
            if (!latLng) {
                continue;
            }

            const [ lat, lng ] = latLng.split(",", 2).map((el) => parseFloat(el));
            const marker = L.marker(L.latLng(lat, lng), {
                draggable: true
            })
                .addTo(map)
                .bindPopup(childNote.title)
                .on("moveend", e => {
                    this.moveMarker(childNote.noteId, (e.target as Marker).getLatLng());
                });
            this.currentMarkerData[childNote.noteId] = marker;
        }
    }

    #adjustCursor() {
        this.geoMapWidget.$container.toggleClass("placing-note", !!this.clipboard);
    }

    async #onMapClicked(e: LeafletMouseEvent) {
        if (!this.clipboard) {
            return;
        }

        this.moveMarker(this.clipboard.noteId, e.latlng);
        this.clipboard = undefined;
        this.#adjustCursor();
    }

    async moveMarker(noteId: string, latLng: LatLng) {
        await attributes.setLabel(noteId, LOCATION_ATTRIBUTE, [latLng.lat, latLng.lng].join(","));
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
        this.#adjustCursor();
    }

    async doRefresh(note: FNote) {
        await this.geoMapWidget.refresh();
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        const attributeRows = loadResults.getAttributeRows();
        if (attributeRows.find((at) => at.name === LOCATION_ATTRIBUTE)) {
            this.#reloadMarkers();
        }
    }

}
