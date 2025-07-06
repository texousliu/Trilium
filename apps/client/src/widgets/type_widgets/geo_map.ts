import { type LatLng, type LeafletMouseEvent } from "leaflet";
import type FNote from "../../entities/fnote.js";
import GeoMapWidget, { type InitCallback, type Leaflet } from "../geo_map.js";
import TypeWidget from "./type_widget.js";
import server from "../../services/server.js";
import toastService from "../../services/toast.js";
import dialogService from "../../services/dialog.js";
import type { CommandListenerData, EventData } from "../../components/app_context.js";
import { t } from "../../services/i18n.js";
import attributes from "../../services/attributes.js";
import link from "../../services/link.js";


import { hasTouchBar } from "../../services/utils.js";

const TPL = /*html*/`\
<div class="note-detail-geo-map note-detail-printable">
    <style>

    </style>
</div>`;

const LOCATION_ATTRIBUTE = "geolocation";
const CHILD_NOTE_ICON = "bx bx-pin";

// TODO: Deduplicate
interface CreateChildResponse {
    note: {
        noteId: string;
    };
}

enum State {
    Normal,
    NewNote
}

export default class GeoMapTypeWidget extends TypeWidget {

    private geoMapWidget: GeoMapWidget;
    private _state: State;
    private L!: Leaflet;
    private ignoreNextZoomEvent?: boolean;

    static getType() {
        return "geoMap";
    }

    constructor() {
        super();

        this.geoMapWidget = new GeoMapWidget("type", (L: Leaflet) => this.#onMapInitialized(L));

        this._state = State.Normal;

        this.child(this.geoMapWidget);
    }

    doRender() {
        super.doRender();

        this.$widget = $(TPL);
        this.$widget.append(this.geoMapWidget.render());
    }

    async #onMapInitialized(L: Leaflet) {
        // this.L = L;

        // // Restore markers.
        // await this.#reloadMarkers();

        // // This fixes an issue with the map appearing cut off at the beginning, due to the container not being properly attached
        // setTimeout(() => {
        //     map.invalidateSize();
        // }, 100);

        // if (hasTouchBar) {
        //     map.on("zoom", () => {
        //         if (!this.ignoreNextZoomEvent) {
        //             this.triggerCommand("refreshTouchBar");
        //         }

        //         this.ignoreNextZoomEvent = false;
        //     });
        // }
    }

    #changeState(newState: State) {
        this._state = newState;
        this.geoMapWidget.$container.toggleClass("placing-note", newState === State.NewNote);
        if (hasTouchBar) {
            this.triggerCommand("refreshTouchBar");
        }
    }

    async #onMapClicked(e: LeafletMouseEvent) {
        if (this._state !== State.NewNote) {
            return;
        }

        toastService.closePersistent("geo-new-note");
        const title = await dialogService.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });

        if (title?.trim()) {
            const { note } = await server.post<CreateChildResponse>(`notes/${this.noteId}/children?target=into`, {
                title,
                content: "",
                type: "text"
            });
            attributes.setLabel(note.noteId, "iconClass", CHILD_NOTE_ICON);
            // this.moveMarker(note.noteId, e.latlng);
        }

        this.#changeState(State.Normal);
    }

    async geoMapCreateChildNoteEvent({ ntxId }: EventData<"geoMapCreateChildNote">) {
        if (!this.isNoteContext(ntxId)) {
            return;
        }

        toastService.showPersistent({
            icon: "plus",
            id: "geo-new-note",
            title: "New note",
            message: t("geo-map.create-child-note-instruction")
        });

        this.#changeState(State.NewNote);

        const globalKeyListener: (this: Window, ev: KeyboardEvent) => any = (e) => {
            if (e.key !== "Escape") {
                return;
            }

            this.#changeState(State.Normal);

            window.removeEventListener("keydown", globalKeyListener);
            toastService.closePersistent("geo-new-note");
        };
        window.addEventListener("keydown", globalKeyListener);
    }

    async doRefresh(note: FNote) {
        await this.geoMapWidget.refresh();
        // this.#restoreViewportAndZoom();
        // await this.#reloadMarkers();
    }

    entitiesReloadedEvent({ loadResults }: EventData<"entitiesReloaded">) {
        // If any of the children branches are altered.
        if (loadResults.getBranchRows().find((branch) => branch.parentNoteId === this.noteId)) {
            // this.#reloadMarkers();
            return;
        }

        // If any of note has its location attribute changed.
        // TODO: Should probably filter by parent here as well.
        const attributeRows = loadResults.getAttributeRows();
        if (attributeRows.find((at) => [LOCATION_ATTRIBUTE, "color"].includes(at.name ?? ""))) {
            // this.#reloadMarkers();
        }
    }

    openGeoLocationEvent({ noteId, event }: EventData<"openGeoLocation">) {
        const marker = this.currentMarkerData[noteId];
        if (!marker) {
            return;
        }

        const latLng = this.currentMarkerData[noteId].getLatLng();
        const url = `geo:${latLng.lat},${latLng.lng}`;
        link.goToLinkExt(event, url);
    }

    deleteFromMapEvent({ noteId }: EventData<"deleteFromMap">) {
        // this.moveMarker(noteId, null);
    }

    buildTouchBarCommand({ TouchBar }: CommandListenerData<"buildTouchBar">) {
        const map = this.geoMapWidget.map;
        const that = this;
        if (!map) {
            return;
        }

        return [
            new TouchBar.TouchBarSlider({
                label: "Zoom",
                value: map.getZoom(),
                minValue: map.getMinZoom(),
                maxValue: map.getMaxZoom(),
                change(newValue) {
                    that.ignoreNextZoomEvent = true;
                    map.setZoom(newValue);
                },
            }),
            new TouchBar.TouchBarButton({
                label: "New geo note",
                click: () => this.triggerCommand("geoMapCreateChildNote", { ntxId: this.ntxId }),
                enabled: (this._state === State.Normal)
            })
        ];
    }

}
