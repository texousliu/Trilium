import type { Extension } from '@codemirror/state';

export interface ThemeDefinition {
    id: string;
    name: string;
    load(): Promise<Extension>;
}

const themes: ThemeDefinition[] = [
    {
        id: "abyss",
        name: "Abyss",
        load: async () => (await import("@fsegurai/codemirror-theme-abyss")).abyss
    },
    {
        id: "abcdef",
        name: "ABCDEF",
        load: async () => (await import("@fsegurai/codemirror-theme-abcdef")).abcdef
    },
    {
        id: "androidStudio",
        name: "Android Studio",
        load: async () => (await import("@fsegurai/codemirror-theme-android-studio")).androidStudio
    },
    {
        id: "andromeda",
        name: "Andromeda",
        load: async () => (await import("@fsegurai/codemirror-theme-andromeda")).andromeda
    },
    {
        id: "basicDark",
        name: "Basic Dark",
        load: async () => (await import("@fsegurai/codemirror-theme-basic-dark")).basicDark
    },
    {
        id: "basicLight",
        name: "Basic Light",
        load: async () => (await import("@fsegurai/codemirror-theme-basic-light")).basicLight
    },
    {
        id: "forest",
        name: "Forest",
        load: async () => (await import("@fsegurai/codemirror-theme-forest")).forest
    },
    {
        id: "githubDark",
        name: "GitHub Dark",
        load: async () => (await import("@fsegurai/codemirror-theme-github-dark")).githubDark
    },
    {
        id: "githubLight",
        name: "GitHub Light",
        load: async () => (await import("@fsegurai/codemirror-theme-github-light")).githubLight
    },
    {
        id: "gruvboxDark",
        name: "Gruvbox Dark",
        load: async () => (await import("@fsegurai/codemirror-theme-gruvbox-dark")).gruvboxDark
    },
    {
        id: "gruvboxLight",
        name: "Gruvbox Light",
        load: async () => (await import("@fsegurai/codemirror-theme-gruvbox-light")).gruvboxLight
    },
    {
        id: "materialDark",
        name: "Material Dark",
        load: async () => (await import("@fsegurai/codemirror-theme-material-dark")).materialDark
    },
    {
        id: "materialLight",
        name: "Material Light",
        load: async () => (await import("@fsegurai/codemirror-theme-material-light")).materialLight
    },
    {
        id: "monokai",
        name: "Monokai",
        load: async () => (await import("@fsegurai/codemirror-theme-monokai")).monokai
    },
    {
        id: "nord",
        name: "Nord",
        load: async () => (await import("@fsegurai/codemirror-theme-nord")).nord
    },
    {
        id: "palenight",
        name: "Palenight",
        load: async () => (await import("@fsegurai/codemirror-theme-palenight")).palenight
    },
    {
        id: "solarizedDark",
        name: "Solarized Dark",
        load: async () => (await import("@fsegurai/codemirror-theme-solarized-dark")).solarizedDark
    },
    {
        id: "solarizedLight",
        name: "Solarized Light",
        load: async () => (await import("@fsegurai/codemirror-theme-solarized-light")).solarizedLight
    },
    {
        id: "tokyoNightDay",
        name: "Tokyo Night Day",
        load: async () => (await import("@fsegurai/codemirror-theme-tokyo-night-day")).tokyoNightDay
    },
    {
        id: "tokyoNightStorm",
        name: "Tokyo Night Storm",
        load: async () => (await import("@fsegurai/codemirror-theme-tokyo-night-storm")).tokyoNightStorm
    },
    {
        id: "volcano",
        name: "Volcano",
        load: async () => (await import("@fsegurai/codemirror-theme-volcano")).volcano
    },
    {
        id: "vsCodeDark",
        name: "VS Code Dark",
        load: async () => (await import("@fsegurai/codemirror-theme-vscode-dark")).vsCodeDark
    },
    {
        id: "vsCodeLight",
        name: "VS Code Light",
        load: async () => (await import("@fsegurai/codemirror-theme-vscode-light")).vsCodeLight
    },
]

export function getThemeById(id: string) {
    for (const theme of themes) {
        if (theme.id === id) {
            return theme;
        }
    }

    return null;
}

export default themes;
