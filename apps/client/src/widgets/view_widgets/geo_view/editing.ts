import { LatLng, LeafletMouseEvent } from "leaflet";
import attributes from "../../../services/attributes";
import { LOCATION_ATTRIBUTE } from "./index.js";
import dialog from "../../../services/dialog";
import server from "../../../services/server";
import { t } from "../../../services/i18n";
import type { Map } from "leaflet";
import type { DragData } from "../../note_tree.js";
import froca from "../../../services/froca.js";
import branches from "../../../services/branches.js";

export function setupDragging($container: JQuery<HTMLElement>, map: Map, mapNoteId: string) {
    $container.on("drop", async (e) => {
        try {

        } catch (e) {
            console.warn(e);
        }
    });
}
