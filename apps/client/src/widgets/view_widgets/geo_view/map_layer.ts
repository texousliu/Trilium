import L from "leaflet";
import type { StyleSpecification } from "maplibre-gl";

interface VectorLayer {
    type: "vector";
    style: string | (() => Promise<StyleSpecification>)
}

interface RasterLayer {
    type: "raster";
    url: string;
    attribution: string;
}

const LAYERS: Record<string, VectorLayer | RasterLayer> = {
    "openstreetmap": {
        type: "raster",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    "versatiles-colorful": {
        type: "vector",
        style: async () => {
            const style = await import("./styles/colorful/en.json");
            return style.default as unknown as StyleSpecification;
        }
    }
};

export default async function getMapLayer(layerName: string) {
    const layer = LAYERS[layerName] ?? LAYERS["openstreetmap"];

    if (layer.type === "vector") {
        const style = (typeof layer.style === "string" ? layer.style : await layer.style());
        await import("@maplibre/maplibre-gl-leaflet");

        return L.maplibreGL({
            style
        });
    }

    return L.tileLayer(layer.url, {
        attribution: layer.attribution,
        detectRetina: true
    });
}
