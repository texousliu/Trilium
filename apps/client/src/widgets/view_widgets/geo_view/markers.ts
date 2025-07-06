import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";
import { marker, latLng, divIcon, Map } from "leaflet";
import type FNote from "../../../entities/fnote.js";
import note_tooltip from "../../../services/note_tooltip.js";
import openContextMenu from "../../type_widgets/geo_map_context_menu.js";

export default function processNoteWithMarker(map: Map, note: FNote, location: string) {
    const [lat, lng] = location.split(",", 2).map((el) => parseFloat(el));
    const icon = buildIcon(note.getIcon(), note.getColorClass(), note.title);

    const newMarker = marker(latLng(lat, lng), {
        icon,
        draggable: true,
        autoPan: true,
        autoPanSpeed: 5
    })
        .addTo(map)
        .on("moveend", (e) => {
            // this.moveMarker(note.noteId, (e.target as Marker).getLatLng());
        });
    newMarker.on("mousedown", ({ originalEvent }) => {
        // Middle click to open in new tab
        if (originalEvent.button === 1) {
            const hoistedNoteId = this.hoistedNoteId;
            //@ts-ignore, fix once tab manager is ported.
            appContext.tabManager.openInNewTab(note.noteId, hoistedNoteId);
            return true;
        }
    });
    newMarker.on("contextmenu", (e) => {
        openContextMenu(note.noteId, e.originalEvent);
    });

    const el = newMarker.getElement();
    if (el) {
        const $el = $(el);
        $el.attr("data-href", `#${note.noteId}`);
        note_tooltip.setupElementTooltip($($el));
    }

    return newMarker;
}

function buildIcon(bxIconClass: string, colorClass?: string, title?: string) {
    return divIcon({
        html: /*html*/`\
            <img class="icon" src="${markerIcon}" />
            <img class="icon-shadow" src="${markerIconShadow}" />
            <span class="bx ${bxIconClass} ${colorClass ?? ""}"></span>
            <span class="title-label">${title ?? ""}</span>`,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });
}
