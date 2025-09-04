import { LatLng } from "leaflet";
import { LOCATION_ATTRIBUTE } from ".";
import attributes from "../../../services/attributes";

export async function moveMarker(noteId: string, latLng: LatLng | null) {
    const value = latLng ? [latLng.lat, latLng.lng].join(",") : "";
    await attributes.setLabel(noteId, LOCATION_ATTRIBUTE, value);
}
