import Map from "./map";
import "./index.css";
import { ViewModeProps } from "../interface";
import { useNoteLabel, useNoteProperty, useSpacedUpdate } from "../../react/hooks";
import { DEFAULT_MAP_LAYER_NAME } from "./map_layer";
import { divIcon, LatLng } from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import Marker from "./marker";
import froca from "../../../services/froca";
import FNote from "../../../entities/fnote";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIconShadow from "leaflet/dist/images/marker-shadow.png";
import appContext from "../../../components/app_context";

const DEFAULT_COORDINATES: [number, number] = [3.878638227135724, 446.6630455551659];
const DEFAULT_ZOOM = 2;
export const LOCATION_ATTRIBUTE = "geolocation";

interface MapData {
    view?: {
        center?: LatLng | [number, number];
        zoom?: number;
    };
}

export default function GeoView({ note, noteIds, viewConfig, saveConfig }: ViewModeProps<MapData>) {
    const [ layerName ] = useNoteLabel(note, "map:style");
    const [ notes, setNotes ] = useState<FNote[]>([]);
    const spacedUpdate = useSpacedUpdate(() => {
        if (viewConfig) {
            saveConfig(viewConfig);
        }
    }, 5000);

    useEffect(() => { froca.getNotes(noteIds).then(setNotes) }, [ noteIds ]);

    return (
        <div className="geo-view">
            <Map
                coordinates={viewConfig?.view?.center ?? DEFAULT_COORDINATES}
                zoom={viewConfig?.view?.zoom ?? DEFAULT_ZOOM}
                layerName={layerName ?? DEFAULT_MAP_LAYER_NAME}
                viewportChanged={(coordinates, zoom) => {
                    if (!viewConfig) viewConfig = {};
                    viewConfig.view = { center: coordinates, zoom };
                    spacedUpdate.scheduleUpdate();
                }}
            >
                {notes.map(note => <NoteMarker note={note} />)}
            </Map>
        </div>
    );
}

function NoteMarker({ note }: { note: FNote }) {
    const [ location ] = useNoteLabel(note, LOCATION_ATTRIBUTE);

    // React to changes
    useNoteLabel(note, "color");
    useNoteLabel(note, "iconClass");

    const title = useNoteProperty(note, "title");
    const colorClass = note.getColorClass();
    const iconClass = note.getIcon();
    const latLng = location?.split(",", 2).map((el) => parseFloat(el)) as [ number, number ] | undefined;
    const icon = useMemo(() => buildIcon(iconClass, colorClass ?? undefined, title, note.noteId), [ iconClass, colorClass, title, note.noteId]);

    return latLng && <Marker
        coordinates={latLng}
        icon={icon}
        mouseDown={useCallback((e: MouseEvent) => {
            // Middle click to open in new tab
            if (e.button === 1) {
                const hoistedNoteId = appContext.tabManager.getActiveContext()?.hoistedNoteId;
                appContext.tabManager.openInNewTab(note.noteId, hoistedNoteId);
                return true;
            }
        }, [ note.noteId ])}
    />
}

function buildIcon(bxIconClass: string, colorClass?: string, title?: string, noteIdLink?: string) {
    let html = /*html*/`\
        <img class="icon" src="${markerIcon}" />
        <img class="icon-shadow" src="${markerIconShadow}" />
        <span class="bx ${bxIconClass} ${colorClass ?? ""}"></span>
        <span class="title-label">${title ?? ""}</span>`;

    if (noteIdLink) {
        html = `<div data-href="#root/${noteIdLink}">${html}</div>`;
    }

    return divIcon({
        html,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });
}
