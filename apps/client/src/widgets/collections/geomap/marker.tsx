import { useContext, useEffect } from "preact/hooks";
import { ParentMap } from "./map";
import { marker } from "leaflet";

export interface MarkerProps {
    coordinates: [ number, number ];
}

export default function Marker({ coordinates }: MarkerProps) {
    const parentMap = useContext(ParentMap);

    useEffect(() => {
        if (!parentMap) return;

        const newMarker = marker(coordinates, {

        });
        newMarker.addTo(parentMap);

        return () => newMarker.removeFrom(parentMap);
    }, [ parentMap, coordinates ]);

    return (<div />)
}
