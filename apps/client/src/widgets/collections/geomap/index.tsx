import Map from "./map";
import "./index.css";

const DEFAULT_COORDINATES: [number, number] = [3.878638227135724, 446.6630455551659];
const DEFAULT_ZOOM = 2;

export default function GeoView() {
    return (
        <div className="geo-view">
            <Map
                coordinates={DEFAULT_COORDINATES}
                zoom={DEFAULT_ZOOM}
            />
        </div>
    );
}
