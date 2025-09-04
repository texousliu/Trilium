import { marker, latLng, divIcon, Map, type Marker } from "leaflet";
import type FNote from "../../../entities/fnote.js";
import openContextMenu from "./context_menu.js";
import server from "../../../services/server.js";
import { moveMarker } from "./editing.js";
import L from "leaflet";

let gpxLoaded = false;

export async function processNoteWithGpxTrack(map: Map, note: FNote) {
    if (!gpxLoaded) {
        const GPX = await import("leaflet-gpx");
        gpxLoaded = true;
    }

    const xmlResponse = await server.get<string | Uint8Array>(`notes/${note.noteId}/open`, undefined, true);
    let stringResponse: string;
    if (xmlResponse instanceof Uint8Array) {
        stringResponse = new TextDecoder().decode(xmlResponse);
    } else {
        stringResponse = xmlResponse;
    }

    const track = new L.GPX(stringResponse, {
        markers: {
            startIcon: buildIcon(note.getIcon(), note.getColorClass(), note.title),
            endIcon: buildIcon("bxs-flag-checkered"),
            wptIcons: {
                "": buildIcon("bx bx-pin")
            }
        },
        polyline_options: {
            color: note.getLabelValue("color") ?? "blue"
        }
    });
    track.addTo(map);
    return track;
}
