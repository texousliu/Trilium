export const DEFAULT_THEME = "white";

interface ThemeDefinition {
    name: string;
    loadTheme: () => Promise<typeof import("*.css?raw")>;
}

const themes: Record<string, ThemeDefinition> = {
    black: {
        name: "Black",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    white: {
        name: "White",
        loadTheme: () => import("reveal.js/dist/theme/white.css?raw")
    },
    beige: {
        name: "Beige",
        loadTheme: () => import("reveal.js/dist/theme/beige.css?raw")
    },
    serif: {
        name: "Serif",
        loadTheme: () => import("reveal.js/dist/theme/serif.css?raw")
    },
    simple: {
        name: "Simple",
        loadTheme: () => import("reveal.js/dist/theme/simple.css?raw")
    },
    solarized: {
        name: "Solarized",
        loadTheme: () => import("reveal.js/dist/theme/solarized.css?raw")
    },
    moon: {
        name: "Moon",
        loadTheme: () => import("reveal.js/dist/theme/moon.css?raw")
    },
    dracula: {
        name: "Dracula",
        loadTheme: () => import("reveal.js/dist/theme/dracula.css?raw")
    },
    sky: {
        name: "Sky",
        loadTheme: () => import("reveal.js/dist/theme/sky.css?raw")
    },
    blood: {
        name: "Blood",
        loadTheme: () => import("reveal.js/dist/theme/blood.css?raw")
    }
} as const;

export function getPresentationThemes() {
    return Object.entries(themes).map(([ id, theme ]) => ({
        id: id,
        name: theme.name
    }));
}

export async function loadPresentationTheme(name: keyof typeof themes) {
    let theme = themes[name];
    if (!theme) theme = themes[DEFAULT_THEME];

    return (await theme.loadTheme()).default;
}
