import type { LatLng } from "leaflet";
import type FNote from "../../entities/fnote.js";
import GeoMapWidget from "../geo_map.js";
import TypeWidget from "./type_widget.js"
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import dialogService from "../../services/dialog.js";
import type { EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";

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
