interface Layer {
    name: string;
}

interface VectorLayer extends Layer {
    type: "vector";
    style: string | (() => Promise<{}>)
}

interface RasterLayer extends Layer {
    type: "raster";
    url: string;
    attribution: string;
}

export const MAP_LAYERS: Record<string, VectorLayer | RasterLayer> = {
    "openstreetmap": {
        name: "OpenStreetMap",
        type: "raster",
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    "versatiles-colorful": {
        name: "Versatiles Colorful (vector)",
        type: "vector",
        style: async () => (await import("./styles/colorful/en.json")).default
    },
    "versatiles-eclipse": {
        name: "Versatiles Eclipse (vector)",
        type: "vector",
        style: async () => (await import("./styles/eclipse/en.json")).default
    },
    "versatiles-graybeard": {
        name: "Versatiles Graybeard (vector)",
        type: "vector",
        style: async () => (await import("./styles/graybeard/en.json")).default
    },
    "versatiles-neutrino": {
        name: "Versatiles Neutrino (vector)",
        type: "vector",
        style: async () => (await import("./styles/neutrino/en.json")).default
    },
    "versatiles-shadow": {
        name: "Versatiles Shadow (vector)",
        type: "vector",
        style: async () => (await import("./styles/shadow/en.json")).default
    }
};

