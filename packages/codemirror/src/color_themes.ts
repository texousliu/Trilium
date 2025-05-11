import type { Extension } from '@codemirror/state';

export interface ThemeDefinition {
    id: string;
    load(): Promise<Extension>;
}

const themes: ThemeDefinition[] = [
    {
        id: "abyss",
        load: async () => (await import("@fsegurai/codemirror-theme-abyss")).abyss
    },
    {
        id: "abcdef",
        load: async () => (await import("@fsegurai/codemirror-theme-abcdef")).abcdef
    },
    {
        id: "androidStudio",
        load: async () => (await import("@fsegurai/codemirror-theme-android-studio")).androidStudio
    },
    {
        id: "andromeda",
        load: async () => (await import("@fsegurai/codemirror-theme-andromeda")).andromeda
    },
    {
        id: "basicDark",
        load: async () => (await import("@fsegurai/codemirror-theme-basic-dark")).basicDark
    },
    {
        id: "basicLight",
        load: async () => (await import("@fsegurai/codemirror-theme-basic-light")).basicLight
    },
    {
        id: "forest",
        load: async () => (await import("@fsegurai/codemirror-theme-forest")).forest
    },
    {
        id: "githubDark",
        load: async () => (await import("@fsegurai/codemirror-theme-github-dark")).githubDark
    },
    {
        id: "githubLight",
        load: async () => (await import("@fsegurai/codemirror-theme-github-light")).githubLight
    },
    {
        id: "gruvboxDark",
        load: async () => (await import("@fsegurai/codemirror-theme-gruvbox-dark")).gruvboxDark
    },
    {
        id: "gruvboxLight",
        load: async () => (await import("@fsegurai/codemirror-theme-gruvbox-light")).gruvboxLight
    },
    {
        id: "materialDark",
        load: async () => (await import("@fsegurai/codemirror-theme-material-dark")).materialDark
    },
    {
        id: "materialLight",
        load: async () => (await import("@fsegurai/codemirror-theme-material-light")).materialLight
    },
    {
        id: "monokai",
        load: async () => (await import("@fsegurai/codemirror-theme-monokai")).monokai
    },
    {
        id: "nord",
        load: async () => (await import("@fsegurai/codemirror-theme-nord")).nord
    },
    {
        id: "palenight",
        load: async () => (await import("@fsegurai/codemirror-theme-palenight")).palenight
    },
    {
        id: "solarizedDark",
        load: async () => (await import("@fsegurai/codemirror-theme-solarized-dark")).solarizedDark
    },
    {
        id: "solarizedLight",
        load: async () => (await import("@fsegurai/codemirror-theme-solarized-light")).solarizedLight
    },
    {
        id: "tokyoNightDay",
        load: async () => (await import("@fsegurai/codemirror-theme-tokyo-night-day")).tokyoNightDay
    },
    {
        id: "tokyoNightStorm",
        load: async () => (await import("@fsegurai/codemirror-theme-tokyo-night-storm")).tokyoNightStorm
    },
    {
        id: "volcano",
        load: async () => (await import("@fsegurai/codemirror-theme-volcano")).volcano
    },
    {
        id: "vsCodeDark",
        load: async () => (await import("@fsegurai/codemirror-theme-vscode-dark")).vsCodeDark
    },
    {
        id: "vsCodeLight",
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
