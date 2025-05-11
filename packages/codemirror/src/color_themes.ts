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
    }
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
