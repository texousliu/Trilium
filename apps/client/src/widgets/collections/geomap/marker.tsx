import { useContext, useEffect } from "preact/hooks";
import { ParentMap } from "./map";
import { DivIcon, Icon, marker } from "leaflet";

export interface MarkerProps {
    coordinates: [ number, number ];
    icon?: Icon | DivIcon;
    mouseDown?: (e: MouseEvent) => void;
}

export default function Marker({ coordinates, icon, mouseDown }: MarkerProps) {
    const parentMap = useContext(ParentMap);

    useEffect(() => {
        if (!parentMap) return;

        const newMarker = marker(coordinates, {
            icon
        });

        if (mouseDown) {
            newMarker.on("mousedown", e => mouseDown(e.originalEvent));
        }

        newMarker.addTo(parentMap);

        return () => newMarker.removeFrom(parentMap);
    }, [ parentMap, coordinates, mouseDown ]);

    return (<div />)
}
