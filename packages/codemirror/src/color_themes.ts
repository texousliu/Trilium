import type { Extension } from '@codemirror/state';

export interface ThemeDefinition {
    name: string;
    load(): Promise<Extension>;
}

const themes: ThemeDefinition[] = [
    {
        name: "abyss",
        load: async () => (await import("@fsegurai/codemirror-theme-abyss")).abyss
    },
    {
        name: "abcdef",
        load: async () => (await import("@fsegurai/codemirror-theme-abcdef")).abcdef
    }
]

export default themes;
