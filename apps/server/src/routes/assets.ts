import assetPath from "../services/asset_path.js";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { getResourceDir, isDev } from "../services/utils.js";
import type serveStatic from "serve-static";
import contentCss from "@triliumnext/ckeditor5/content.css";

const persistentCacheStatic = (root: string, options?: serveStatic.ServeStaticOptions<express.Response<unknown, Record<string, unknown>>>) => {
    if (!isDev) {
        options = {
            maxAge: "1y",
            ...options
        };
    }
    return express.static(root, options);
};

async function register(app: express.Application) {
    const srcRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
    const resourceDir = getResourceDir();

    app.use(`/${assetPath}/libraries/ckeditor/ckeditor-content.css`, (req, res) => res.contentType("text/css").send(contentCss));

    if (isDev) {
        const publicUrl = process.env.TRILIUM_PUBLIC_SERVER;
        if (!publicUrl) {
            throw new Error("Missing TRILIUM_PUBLIC_SERVER");
        }
    } else {
        const clientStaticCache = persistentCacheStatic(path.join(resourceDir, "public"));
        app.use(`/${assetPath}/app`, clientStaticCache);
        app.use(`/${assetPath}/app-dist`, clientStaticCache);
        app.use(`/${assetPath}/stylesheets`, persistentCacheStatic(path.join(resourceDir, "public", "stylesheets")));
        app.use(`/${assetPath}/libraries`, persistentCacheStatic(path.join(resourceDir, "public", "libraries")));
        app.use(`/${assetPath}/fonts`, persistentCacheStatic(path.join(resourceDir, "public", "fonts")));
        app.use(`/${assetPath}/translations/`, persistentCacheStatic(path.join(resourceDir, "public", "translations")));
        app.use(`/${assetPath}/images`, persistentCacheStatic(path.join(resourceDir, "assets", "images")));
        app.use(`/${assetPath}/app-dist/doc_notes`, persistentCacheStatic(path.join(resourceDir, "assets", "doc_notes")));
        app.use(`/${assetPath}/app-dist/excalidraw/fonts`, persistentCacheStatic(path.join(resourceDir, "node_modules/@excalidraw/excalidraw/dist/prod/fonts")));
    }
    app.use(`/assets/vX/fonts`, express.static(path.join(srcRoot, "public/fonts")));
    app.use(`/assets/vX/images`, express.static(path.join(srcRoot, "..", "images")));
    app.use(`/assets/vX/stylesheets`, express.static(path.join(srcRoot, "public/stylesheets")));
    app.use(`/${assetPath}/libraries`, persistentCacheStatic(path.join(srcRoot, "public/libraries")));
    app.use(`/assets/vX/libraries`, express.static(path.join(srcRoot, "..", "libraries")));

    const nodeModulesDir = isDev ? path.join(srcRoot, "..", "node_modules") : path.join(resourceDir, "node_modules");

    app.use(`/node_modules/@excalidraw/excalidraw/dist/fonts/`, express.static(path.join(nodeModulesDir, "@excalidraw/excalidraw/dist/prod/fonts/")));
    app.use(`/${assetPath}/node_modules/@excalidraw/excalidraw/dist/fonts/`, persistentCacheStatic(path.join(nodeModulesDir, "@excalidraw/excalidraw/dist/prod/fonts/")));

    // KaTeX
    app.use(`/${assetPath}/node_modules/katex/dist/katex.min.js`, persistentCacheStatic(path.join(nodeModulesDir, "katex/dist/katex.min.js")));
    app.use(`/${assetPath}/node_modules/katex/dist/contrib/mhchem.min.js`, persistentCacheStatic(path.join(nodeModulesDir, "katex/dist/contrib/mhchem.min.js")));
    app.use(`/${assetPath}/node_modules/katex/dist/contrib/auto-render.min.js`, persistentCacheStatic(path.join(nodeModulesDir, "katex/dist/contrib/auto-render.min.js")));
    // expose the whole dist folder
    app.use(`/node_modules/katex/dist/`, express.static(path.join(nodeModulesDir, "katex/dist/")));
    app.use(`/${assetPath}/node_modules/katex/dist/`, persistentCacheStatic(path.join(nodeModulesDir, "katex/dist/")));

    app.use(`/${assetPath}/node_modules/jquery/dist/`, persistentCacheStatic(path.join(nodeModulesDir, "jquery/dist/")));

    app.use(`/${assetPath}/node_modules/jquery-hotkeys/`, persistentCacheStatic(path.join(nodeModulesDir, "jquery-hotkeys/")));

    app.use(`/${assetPath}/node_modules/normalize.css/`, persistentCacheStatic(path.join(nodeModulesDir, "normalize.css/")));

    app.use(`/${assetPath}/node_modules/jquery.fancytree/dist/`, persistentCacheStatic(path.join(nodeModulesDir, "jquery.fancytree/dist/")));
}

export default {
    register
};
