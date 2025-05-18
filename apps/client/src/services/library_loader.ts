export interface Library {
    js?: string[] | (() => string[]);
    css?: string[];
}

const KATEX: Library = {
    js: ["node_modules/katex/dist/katex.min.js", "node_modules/katex/dist/contrib/mhchem.min.js", "node_modules/katex/dist/contrib/auto-render.min.js"],
    css: ["node_modules/katex/dist/katex.min.css"]
};

async function requireLibrary(library: Library) {
    if (library.css) {
        library.css.map((cssUrl) => requireCss(cssUrl));
    }

    if (library.js) {
        for (const scriptUrl of await unwrapValue(library.js)) {
            await requireScript(scriptUrl);
        }
    }
}

async function unwrapValue<T>(value: T | (() => T) | Promise<T>) {
    if (value && typeof value === "object" && "then" in value) {
        return (await (value as Promise<() => T>))();
    }

    if (typeof value === "function") {
        return (value as () => T)();
    }

    return value;
}

// we save the promises in case of the same script being required concurrently multiple times
const loadedScriptPromises: Record<string, JQuery.jqXHR> = {};

async function requireScript(url: string) {
    url = `${window.glob.assetPath}/${url}`;

    if (!loadedScriptPromises[url]) {
        loadedScriptPromises[url] = $.ajax({
            url: url,
            dataType: "script",
            cache: true
        });
    }

    await loadedScriptPromises[url];
}

async function requireCss(url: string, prependAssetPath = true) {
    const cssLinks = Array.from(document.querySelectorAll("link")).map((el) => el.href);

    if (!cssLinks.some((l) => l.endsWith(url))) {
        if (prependAssetPath) {
            url = `${window.glob.assetPath}/${url}`;
        }

        $("head").append($('<link rel="stylesheet" type="text/css" />').attr("href", url));
    }
}

export default {
    requireCss,
    requireLibrary,
    KATEX
};
