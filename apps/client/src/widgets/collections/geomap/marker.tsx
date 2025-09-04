import { useContext, useEffect } from "preact/hooks";
import { ParentMap } from "./map";
import { DivIcon, Icon, LatLng, Marker as LeafletMarker, marker, MarkerOptions } from "leaflet";

export interface MarkerProps {
    coordinates: [ number, number ];
    icon?: Icon | DivIcon;
    mouseDown?: (e: MouseEvent) => void;
    dragged: ((newCoordinates: LatLng) => void)
    draggable?: boolean;
}

export default function Marker({ coordinates, icon, draggable, dragged, mouseDown }: MarkerProps) {
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

        if (mouseDown) {
            newMarker.on("mousedown", e => mouseDown(e.originalEvent));
        }

        if (dragged) {
            newMarker.on("moveend", e => {
                const coordinates = (e.target as LeafletMarker).getLatLng();
                dragged(coordinates);
            });
        }

        newMarker.addTo(parentMap);

        return () => newMarker.removeFrom(parentMap);
    }, [ parentMap, coordinates, mouseDown ]);

    return (<div />)
}
