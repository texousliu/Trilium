import Map from "./map";
import "./index.css";
import { ViewModeProps } from "../interface";
import { useNoteLabel, useSpacedUpdate } from "../../react/hooks";
import { DEFAULT_MAP_LAYER_NAME } from "./map_layer";
import { LatLng } from "leaflet";
import { useEffect, useRef, useState } from "preact/hooks";
import Marker, { MarkerProps } from "./marker";
import froca from "../../../services/froca";

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
    const [ markers, setMarkers ] = useState<MarkerProps[]>([]);
    const spacedUpdate = useSpacedUpdate(() => {
        if (viewConfig) {
            saveConfig(viewConfig);
        }
    }, 5000);

    async function refreshMarkers() {
        const notes = await froca.getNotes(noteIds);
        const markers: MarkerProps[] = [];
        for (const childNote of notes) {
            const latLng = childNote.getAttributeValue("label", LOCATION_ATTRIBUTE);
            if (!latLng) continue;

            const [lat, lng] = latLng.split(",", 2).map((el) => parseFloat(el));
            markers.push({
                coordinates: [lat, lng]
            })
        }

        console.log("Built ", markers);
        setMarkers(markers);
    }

    useEffect(() => {
        refreshMarkers();
    }, [ note ]);

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
                {markers.map(marker => <Marker {...marker} />)}
            </Map>
        </div>
    );
}
