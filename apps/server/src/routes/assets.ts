import assetPath from "../services/asset_path.js";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { getResourceDir, isDev } from "../services/utils.js";
import type serveStatic from "serve-static";
import proxy from "express-http-proxy";

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

    if (isDev) {
        const publicUrl = process.env.TRILIUM_PUBLIC_SERVER;
        if (!publicUrl) {
            throw new Error("Missing TRILIUM_PUBLIC_SERVER");
        }
        app.use(`/@fs`, proxy(publicUrl, {
            proxyReqPathResolver: (req) => `/@fs` + req.url
        }))
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
    }
    app.use(`/assets/vX/fonts`, express.static(path.join(srcRoot, "public/fonts")));
    app.use(`/assets/vX/images`, express.static(path.join(srcRoot, "..", "images")));
    app.use(`/assets/vX/stylesheets`, express.static(path.join(srcRoot, "public/stylesheets")));
    app.use(`/${assetPath}/libraries`, persistentCacheStatic(path.join(srcRoot, "public/libraries")));
    app.use(`/assets/vX/libraries`, express.static(path.join(srcRoot, "..", "libraries")));

    const nodeModulesDir = isDev ? path.join(srcRoot, "..", "node_modules") : path.join(resourceDir, "node_modules");

    app.use(`/${assetPath}/node_modules/jquery/dist/`, persistentCacheStatic(path.join(nodeModulesDir, "jquery/dist/")));

    app.use(`/${assetPath}/node_modules/jquery-hotkeys/`, persistentCacheStatic(path.join(nodeModulesDir, "jquery-hotkeys/")));

    app.use(`/${assetPath}/node_modules/jquery.fancytree/dist/`, persistentCacheStatic(path.join(nodeModulesDir, "jquery.fancytree/dist/")));
}

export default {
    register
};
