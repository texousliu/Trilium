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

export default themes;
