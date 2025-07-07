import type { LatLng, LeafletMouseEvent } from "leaflet";
import appContext from "../../../components/app_context.js";
import contextMenu from "../../../menus/context_menu.js";
import linkContextMenu from "../../../menus/link_context_menu.js";
import { t } from "../../../services/i18n.js";
import { createNewNote } from "./editing.js";
import { copyTextWithToast } from "../../../services/clipboard_ext.js";
import link from "../../../services/link.js";

export default function openContextMenu(noteId: string, e: LeafletMouseEvent) {
    contextMenu.show({
        x: e.originalEvent.pageX,
        y: e.originalEvent.pageY,
        items: [
            ...buildGeoLocationItem(e),
            ...linkContextMenu.getItems(),
            { title: "----" },
            { title: t("geo-map-context.remove-from-map"), command: "deleteFromMap", uiIcon: "bx bx-trash" }
        ],
        selectMenuItemHandler: ({ command }, e) => {
            if (command === "deleteFromMap") {
                appContext.triggerCommand(command, { noteId });
                return;
            }

            // Pass the events to the link context menu
            linkContextMenu.handleLinkContextMenuItem(command, noteId);
        }
    });
}

export function openMapContextMenu(noteId: string, e: LeafletMouseEvent) {
    contextMenu.show({
        x: e.originalEvent.pageX,
        y: e.originalEvent.pageY,
        items: [
            ...buildGeoLocationItem(e),
            { title: t("geo-map-context.add-note"), command: "addNoteToMap", uiIcon: "bx bx-plus" }
        ],
        selectMenuItemHandler: ({ command }) => {
            switch (command) {
                case "addNoteToMap":
                    createNewNote(noteId, e);
                    break;
                default:
                    return;
            }
        }
    });
}

function buildGeoLocationItem(e: LeafletMouseEvent) {
    function formatGeoLocation(latlng: LatLng, precision: number = 6) {
        return `${latlng.lat.toFixed(precision)}, ${latlng.lng.toFixed(precision)}`;
    }

    return [
        {
            title: formatGeoLocation(e.latlng),
            uiIcon: "bx bx-current-location",
            handler: () => copyTextWithToast(formatGeoLocation(e.latlng, 15))
        },
        {
            title: t("geo-map-context.open-location"),
            uiIcon: "bx bx-map-alt",
            handler: () => link.goToLinkExt(null, `geo:${e.latlng.lat},${e.latlng.lng}`)
        },
        {
            title: "----"
        }
    ];
}
