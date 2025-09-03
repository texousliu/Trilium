import Map from "./map";
import "./index.css";
import { ViewModeProps } from "../interface";
import { useNoteLabel } from "../../react/hooks";
import { DEFAULT_MAP_LAYER_NAME } from "./map_layer";

const DEFAULT_COORDINATES: [number, number] = [3.878638227135724, 446.6630455551659];
const DEFAULT_ZOOM = 2;

export default function GeoView({ note }: ViewModeProps) {
    const [ layerName ] = useNoteLabel(note, "map:style");

    return (
        <div className="geo-view">
            <Map
                coordinates={DEFAULT_COORDINATES}
                zoom={DEFAULT_ZOOM}
                layerName={layerName ?? DEFAULT_MAP_LAYER_NAME}
            />
        </div>
    );
}
