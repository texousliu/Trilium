import { LatLng, LeafletMouseEvent } from "leaflet";
import attributes from "../../../services/attributes";
import { LOCATION_ATTRIBUTE } from "./index.js";
import dialog from "../../../services/dialog";
import server from "../../../services/server";
import { t } from "../../../services/i18n";

const CHILD_NOTE_ICON = "bx bx-pin";

// TODO: Deduplicate
interface CreateChildResponse {
    note: {
        noteId: string;
    };
}

export async function moveMarker(noteId: string, latLng: LatLng | null) {
    const value = latLng ? [latLng.lat, latLng.lng].join(",") : "";
    await attributes.setLabel(noteId, LOCATION_ATTRIBUTE, value);
}

export async function createNewNote(noteId: string, e: LeafletMouseEvent) {
    const title = await dialog.prompt({ message: t("relation_map.enter_title_of_new_note"), defaultValue: t("relation_map.default_new_note_title") });

    if (title?.trim()) {
        const { note } = await server.post<CreateChildResponse>(`notes/${noteId}/children?target=into`, {
            title,
            content: "",
            type: "text"
        });
        attributes.setLabel(note.noteId, "iconClass", CHILD_NOTE_ICON);
        moveMarker(note.noteId, e.latlng);
    }
}
