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

export default function GeoView({ note, viewStorage }: ViewModeProps<MapData>) {
    const [ layerName ] = useNoteLabel(note, "map:style");
    const viewOptions = useRef<MapData["view"]>();
    const spacedUpdate = useSpacedUpdate(() => {
        viewStorage.store({
            view: viewOptions.current
        });
    }, 5000);

    // Clean up on note change.
    useEffect(() => {
        viewStorage.restore().then(data => {
            viewOptions.current = data?.view;
        });
    }, [ note ]);

    return (
        <div className="geo-view">
            <Map
                coordinates={DEFAULT_COORDINATES}
                zoom={DEFAULT_ZOOM}
                layerName={layerName ?? DEFAULT_MAP_LAYER_NAME}
                viewportChanged={(coordinates, zoom) => {
                    if (!viewOptions.current) return;
                    viewOptions.current.center = coordinates;
                    viewOptions.current.zoom = zoom;
                    spacedUpdate.scheduleUpdate();
                }}
            />
        </div>
    );
}
