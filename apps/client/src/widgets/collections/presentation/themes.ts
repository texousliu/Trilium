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
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    beige: {
        name: "Beige",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    serif: {
        name: "Serif",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    simple: {
        name: "Simple",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    solarized: {
        name: "Solarized",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    moon: {
        name: "Moon",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    dracula: {
        name: "Dracula",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    sky: {
        name: "Sky",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    },
    blood: {
        name: "Blood",
        loadTheme: () => import("reveal.js/dist/theme/black.css?raw")
    }
} as const;

export function getPresentationThemes() {
    return Object.entries(themes).map(([ id, theme ]) => ({
        id: id,
        name: theme.name
    }));
}

export async function loadPresentationTheme(name: keyof typeof themes) {
    const theme = themes[name];
    if (!theme) return;

    return (await theme.loadTheme()).default;
}
