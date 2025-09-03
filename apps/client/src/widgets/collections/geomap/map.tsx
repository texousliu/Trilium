import { useEffect, useRef, useState } from "preact/hooks";
import L, { LatLng, Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_LAYERS } from "./map_layer";

interface MapProps {
    coordinates: LatLng | [number, number];
    zoom: number;
    layerName: string;
}

export default function Map({ coordinates, zoom, layerName }: MapProps) {
    const mapRef = useRef<L.Map>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        mapRef.current = L.map(containerRef.current, {
            worldCopyJump: true
        });
    }, []);

    // Load the layer asynchronously.
    const [ layer, setLayer ] = useState<Layer>();
    useEffect(() => {
        async function load() {
            const layerData = MAP_LAYERS[layerName];

            if (layerData.type === "vector") {
                const style = (typeof layerData.style === "string" ? layerData.style : await layerData.style());
                await import("@maplibre/maplibre-gl-leaflet");

                setLayer(L.maplibreGL({
                    style: style as any
                }));
            } else {
                setLayer(L.tileLayer(layerData.url, {
                    attribution: layerData.attribution,
                    detectRetina: true
                }));
            }
        }

        load();
    }, [ layerName ]);

    // Attach layer to the map.
    useEffect(() => {
        const map = mapRef.current;
        const layerToAdd = layer;
        console.log("Add layer ", map, layerToAdd);
        if (!map || !layerToAdd) return;
        layerToAdd.addTo(map);
        return () => layerToAdd.removeFrom(map);
    }, [ mapRef, layer ]);

    // React to coordinate changes.
    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.setView(coordinates, zoom);
    }, [ mapRef, coordinates, zoom ]);

    return <div ref={containerRef} className="geo-map-container" />;
}
