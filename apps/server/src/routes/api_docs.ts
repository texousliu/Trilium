import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function register(app: Application) {
    const etapiDocument = yaml.load(readFileSync(join(__dirname, "../etapi/etapi.openapi.yaml"), "utf8")) as JsonObject;
    const apiDocument = JSON.parse(readFileSync(join(__dirname, "api", "openapi.json"), "utf-8"));

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
