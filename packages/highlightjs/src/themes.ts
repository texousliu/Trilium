export interface Theme {
    name: string;
    load: () => Promise<{ default: typeof import("*.css", { with: { "resolution-mode": "import" } }); }>;
}

const themeDefinitions: Record<string, Theme> = {
    "1c-light": {
        name: "1C (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/1c-light.css?raw")
    },
    "a11y-dark": {
        name: "a11y (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/a11y-dark.css?raw")
    },
    "a11y-light": {
        name: "a11y (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/a11y-light.css?raw")
    },
    "agate": {
        name: "Agate (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/agate.css?raw")
    },
    "an-old-hope": {
        name: "An Old Hope (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/an-old-hope.css?raw")
    },
    "androidstudio": {
        name: "Android Studio (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/androidstudio.css?raw")
    },
    "arduino-light": {
        name: "Arduino (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/arduino-light.css?raw")
    },
    "arta": {
        name: "Arta (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/arta.css?raw")
    },
    "ascetic": {
        name: "Ascetic (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/ascetic.css?raw")
    },
    "atom-one-dark-reasonable": {
        name: "Atom One with ReasonML support (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/atom-one-dark-reasonable.css?raw")
    },
    "atom-one-dark": {
        name: "Atom One (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/atom-one-dark.css?raw")
    },
    "atom-one-light": {
        name: "Atom One (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/atom-one-light.css?raw")
    },
    "brown-paper": {
        name: "Brown Paper (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/brown-paper.css?raw")
    },
    "codepen-embed": {
        name: "CodePen Embed (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/codepen-embed.css?raw")
    },
    "color-brewer": {
        name: "Color Brewer (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/color-brewer.css?raw")
    },
    "cybertopia-cherry": {
        name: "Cybertopia Cherry (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/cybertopia-cherry.css?raw")
    },
    "cybertopia-dimmer": {
        name: "Cybertopia Dimmer (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/cybertopia-dimmer.css?raw")
    },
    "cybertopia-icecap": {
        name: "Cybertopia Icecap (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/cybertopia-icecap.css?raw")
    },
    "cybertopia-saturated": {
        name: "Cybertopia Saturated (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/cybertopia-saturated.css?raw")
    },
    "dark": {
        name: "Dark",
        load: () => import("@highlightjs/cdn-assets/styles/dark.css?raw")
    },
    "default": {
        name: "Original highlight.js Theme (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/default.css?raw")
    },
    "devibeans": {
        name: "devibeans (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/devibeans.css?raw")
    },
    "docco": {
        name: "Docco (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/docco.css?raw")
    },
    "far": {
        name: "FAR (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/far.css?raw")
    },
    "felipec": {
        name: "FelipeC (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/felipec.css?raw")
    },
    "foundation": {
        name: "Foundation 4 Docs (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/foundation.css?raw")
    },
    "github-dark-dimmed": {
        name: "GitHub Dimmed (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/github-dark-dimmed.css?raw")
    },
    "github-dark": {
        name: "GitHub (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/github-dark.css?raw")
    },
    "github": {
        name: "GitHub (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/github.css?raw")
    },
    "gml": {
        name: "GML (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/gml.css?raw")
    },
    "googlecode": {
        name: "Google Code (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/googlecode.css?raw")
    },
    "gradient-dark": {
        name: "Gradient (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/gradient-dark.css?raw")
    },
    "gradient-light": {
        name: "Gradient (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/gradient-light.css?raw")
    },
    "grayscale": {
        name: "Grayscale (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/grayscale.css?raw")
    },
    "hybrid": {
        name: "hybrid (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/hybrid.css?raw")
    },
    "idea": {
        name: "Idea (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/idea.css?raw")
    },
    "intellij-light": {
        name: "IntelliJ (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/intellij-light.css?raw")
    },
    "ir-black": {
        name: "IR Black (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/ir-black.css?raw")
    },
    "isbl-editor-dark": {
        name: "ISBL Editor (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/isbl-editor-dark.css?raw")
    },
    "isbl-editor-light": {
        name: "ISBL Editor (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/isbl-editor-light.css?raw")
    },
    "kimbie-dark": {
        name: "Kimbie (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/kimbie-dark.css?raw")
    },
    "kimbie-light": {
        name: "Kimbie (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/kimbie-light.css?raw")
    },
    "lightfair": {
        name: "Lightfair (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/lightfair.css?raw")
    },
    "lioshi": {
        name: "Lioshi (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/lioshi.css?raw")
    },
    "magula": {
        name: "Magula (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/magula.css?raw")
    },
    "mono-blue": {
        name: "Mono Blue (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/mono-blue.css?raw")
    },
    "monokai-sublime": {
        name: "Monokai Sublime (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/monokai-sublime.css?raw")
    },
    "monokai": {
        name: "Monokai (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/monokai.css?raw")
    },
    "night-owl": {
        name: "Night Owl (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/night-owl.css?raw")
    },
    "nnfx-dark": {
        name: "NNFX (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/nnfx-dark.css?raw")
    },
    "nnfx-light": {
        name: "NNFX (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/nnfx-light.css?raw")
    },
    "nord": {
        name: "Nord (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/nord.css?raw")
    },
    "obsidian": {
        name: "Obsidian (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/obsidian.css?raw")
    },
    "panda-syntax-dark": {
        name: "Panda (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/panda-syntax-dark.css?raw")
    },
    "panda-syntax-light": {
        name: "Panda (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/panda-syntax-light.css?raw")
    },
    "paraiso-dark": {
        name: "Paraiso (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/paraiso-dark.css?raw")
    },
    "paraiso-light": {
        name: "Paraiso (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/paraiso-light.css?raw")
    },
    "pojoaque": {
        name: "Pojoaque (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/pojoaque.css?raw")
    },
    "purebasic": {
        name: "PureBasic (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/purebasic.css?raw")
    },
    "qtcreator-dark": {
        name: "Qt Creator (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/qtcreator-dark.css?raw")
    },
    "qtcreator-light": {
        name: "Qt Creator (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/qtcreator-light.css?raw")
    },
    "rainbow": {
        name: "Rainbow (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/rainbow.css?raw")
    },
    "routeros": {
        name: "RouterOS Script (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/routeros.css?raw")
    },
    "rose-pine-dawn": {
        name: "Rose Pine Dawn (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/rose-pine-dawn.css?raw")
    },
    "rose-pine-moon": {
        name: "Rose Pine Moon (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/rose-pine-moon.css?raw")
    },
    "rose-pine": {
        name: "Rose Pine (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/rose-pine.css?raw")
    },
    "school-book": {
        name: "School Book (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/school-book.css?raw")
    },
    "shades-of-purple": {
        name: "Shades of Purple (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/shades-of-purple.css?raw")
    },
    "srcery": {
        name: "Srcery (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/srcery.css?raw")
    },
    "stackoverflow-dark": {
        name: "Stack Overflow (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/stackoverflow-dark.css?raw")
    },
    "stackoverflow-light": {
        name: "Stack Overflow (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/stackoverflow-light.css?raw")
    },
    "sunburst": {
        name: "Sunburst (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/sunburst.css?raw")
    },
    "tokyo-night-dark": {
        name: "Tokyo Night (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/tokyo-night-dark.css?raw")
    },
    "tokyo-night-light": {
        name: "Tokyo Night (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/tokyo-night-light.css?raw")
    },
    "tomorrow-night-blue": {
        name: "Tomorrow Night Blue (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/tomorrow-night-blue.css?raw")
    },
    "tomorrow-night-bright": {
        name: "Tomorrow Night Bright (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/tomorrow-night-bright.css?raw")
    },
    "vs": {
        name: "Visual Studio (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/vs.css?raw")
    },
    "vs2015": {
        name: "Visual Studio 2015 (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/vs2015.css?raw")
    },
    "xcode": {
        name: "Xcode (Light)",
        load: () => import("@highlightjs/cdn-assets/styles/xcode.css?raw")
    },
    "xt256": {
        name: "xt256 (Dark)",
        load: () => import("@highlightjs/cdn-assets/styles/xt256.css?raw")
    }
}

export default themeDefinitions;
