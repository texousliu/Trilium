import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";
import { readFileSync, existsSync } from "fs";
import { RESOURCE_DIR } from "../services/resource_dir";

export default function register(app: Application) {
    // In packaged Electron apps, check if we need to read from the unpacked directory
    let resourceDir = RESOURCE_DIR;
    if (resourceDir.includes('app.asar')) {
        const unpackedDir = RESOURCE_DIR.replace('app.asar', 'app.asar.unpacked');
        // Check if the unpacked directory has our files
        if (existsSync(join(unpackedDir, "etapi.openapi.yaml"))) {
            resourceDir = unpackedDir;
        }
    }
    
    const etapiDocument = yaml.load(readFileSync(join(resourceDir, "etapi.openapi.yaml"), "utf8")) as JsonObject;
    const apiDocument = JSON.parse(readFileSync(join(resourceDir, "openapi.json"), "utf-8"));

    app.use(
        "/etapi/docs/",
        swaggerUi.serveFiles(etapiDocument),
        swaggerUi.setup(etapiDocument, {
            explorer: true,
            customSiteTitle: "TriliumNext ETAPI Documentation"
        })
    );

    app.use(
        "/api/docs/",
        swaggerUi.serveFiles(apiDocument),
        swaggerUi.setup(apiDocument, {
            explorer: true,
            customSiteTitle: "TriliumNext Internal API Documentation"
        })
    );
}
