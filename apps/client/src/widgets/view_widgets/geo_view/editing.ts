import { LatLng } from "leaflet";
import attributes from "../../../services/attributes";
import { LOCATION_ATTRIBUTE } from "./index.js";

export async function moveMarker(noteId: string, latLng: LatLng | null) {
    const value = latLng ? [latLng.lat, latLng.lng].join(",") : "";
    await attributes.setLabel(noteId, LOCATION_ATTRIBUTE, value);
}
