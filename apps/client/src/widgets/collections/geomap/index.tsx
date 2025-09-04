import Map from "./map";
import "./index.css";
import { ViewModeProps } from "../interface";
import { useNoteLabel, useSpacedUpdate } from "../../react/hooks";
import { DEFAULT_MAP_LAYER_NAME } from "./map_layer";
import { LatLng } from "leaflet";
import { useEffect, useRef } from "preact/hooks";

const DEFAULT_COORDINATES: [number, number] = [3.878638227135724, 446.6630455551659];
const DEFAULT_ZOOM = 2;

interface MapData {
    view?: {
        center?: LatLng | [number, number];
        zoom?: number;
    };
}

export default function GeoView({ note, viewConfig, saveConfig }: ViewModeProps<MapData>) {
    const [ layerName ] = useNoteLabel(note, "map:style");
    const spacedUpdate = useSpacedUpdate(() => {
        if (viewConfig) {
            saveConfig(viewConfig);
        }
    }, 5000);

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
            />
        </div>
    );
}
