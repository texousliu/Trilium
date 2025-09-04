import { useContext, useEffect } from "preact/hooks";
import { ParentMap } from "./map";
import { DivIcon, Icon, LatLng, Marker as LeafletMarker, marker, MarkerOptions } from "leaflet";

export interface MarkerProps {
    coordinates: [ number, number ];
    icon?: Icon | DivIcon;
    onClick?: () => void;
    onMouseDown?: (e: MouseEvent) => void;
    onDragged?: ((newCoordinates: LatLng) => void);
    draggable?: boolean;
}

export default function Marker({ coordinates, icon, draggable, onClick, onDragged, onMouseDown }: MarkerProps) {
    const parentMap = useContext(ParentMap);

    useEffect(() => {
        if (!parentMap) return;

        const options: MarkerOptions = { icon };
        if (draggable) {
            options.draggable = true;
            options.autoPan = true;
            options.autoPanSpeed = 5;
        }

        const newMarker = marker(coordinates, options);

        if (onClick) {
            newMarker.on("click", () => onClick());
        }

        if (onMouseDown) {
            newMarker.on("mousedown", e => onMouseDown(e.originalEvent));
        }

        if (onDragged) {
            newMarker.on("moveend", e => {
                const coordinates = (e.target as LeafletMarker).getLatLng();
                onDragged(coordinates);
            });
        }

        newMarker.addTo(parentMap);

        return () => newMarker.removeFrom(parentMap);
    }, [ parentMap, coordinates, onMouseDown, onDragged ]);

    return (<div />)
}
