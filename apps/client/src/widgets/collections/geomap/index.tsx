import Map from "./map";
import "./index.css";
import { ViewModeProps } from "../interface";
import { useNoteLabel, useSpacedUpdate } from "../../react/hooks";
import { DEFAULT_MAP_LAYER_NAME } from "./map_layer";
import { LatLng } from "leaflet";
import { useEffect, useState } from "preact/hooks";
import Marker from "./marker";
import froca from "../../../services/froca";
import FNote from "../../../entities/fnote";

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
    const latLng = location?.split(",", 2).map((el) => parseFloat(el)) as [ number, number ] | undefined;

    return latLng && <Marker coordinates={latLng} />
}
