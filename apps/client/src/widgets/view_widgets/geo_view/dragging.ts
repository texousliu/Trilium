import type { Map } from "leaflet";
import type { DragData } from "../../note_tree.js";
import { moveMarker } from "./editing";

export default function setupDragging($container: JQuery<HTMLElement>, map: Map) {
    $container.on("dragover", (e) => {
        // Allow drag.
        e.preventDefault();
    });
    $container.on("drop", (e) => {
        if (!e.originalEvent) {
            return;
        }

        const data = e.originalEvent.dataTransfer?.getData('text');
        if (!data) {
            return;
        }

        try {
            const parsedData = JSON.parse(data) as DragData[];
            if (!parsedData.length) {
                return;
            }

            const { noteId } = parsedData[0];

            var offset = $container.offset();
            var x = e.originalEvent.clientX - (offset?.left ?? 0);
            var y = e.originalEvent.clientY - (offset?.top ?? 0);

            const latlng = map.containerPointToLatLng([ x, y ]);
            moveMarker(noteId, latlng);
        } catch (e) {
            console.warn(e);
        }
    });
}
