import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";
import { readFileSync } from "fs";
import { RESOURCE_DIR } from "../services/resource_dir";

export default function register(app: Application) {
    // Clean trailing slashes from RESOURCE_DIR to prevent path resolution issues in packaged Electron apps
    const cleanResourceDir = RESOURCE_DIR.replace(/[\\\/]+$/, '');
    
    const etapiDocument = yaml.load(readFileSync(join(cleanResourceDir, "etapi.openapi.yaml"), "utf8")) as JsonObject;
    const apiDocument = JSON.parse(readFileSync(join(cleanResourceDir, "openapi.json"), "utf-8"));

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
