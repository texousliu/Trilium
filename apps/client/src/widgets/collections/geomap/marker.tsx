import { useContext, useEffect } from "preact/hooks";
import { ParentMap } from "./map";
import { DivIcon, Icon, marker } from "leaflet";

export interface MarkerProps {
    coordinates: [ number, number ];
    icon?: Icon | DivIcon;
}

export default function Marker({ coordinates, icon }: MarkerProps) {
    const parentMap = useContext(ParentMap);

    useEffect(() => {
        if (!parentMap) return;

        const newMarker = marker(coordinates, {
            icon
        });
        newMarker.addTo(parentMap);

        return () => newMarker.removeFrom(parentMap);
    }, [ parentMap, coordinates ]);

    return (<div />)
}
