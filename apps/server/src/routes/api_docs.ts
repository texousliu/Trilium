import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";
import { readFileSync, existsSync } from "fs";
import { RESOURCE_DIR } from "../services/resource_dir";

export default function register(app: Application) {
    const etapiDocument = yaml.load(readFileSync(join(RESOURCE_DIR, "etapi.openapi.yaml"), "utf8")) as JsonObject;
    
    // Load the comprehensive API documentation (YAML) if available, otherwise fall back to JSON
    const apiYamlPath = join(RESOURCE_DIR, "api-openapi.yaml");
    const apiJsonPath = join(RESOURCE_DIR, "openapi.json");
    
    let apiDocument: JsonObject;
    if (existsSync(apiYamlPath)) {
        apiDocument = yaml.load(readFileSync(apiYamlPath, "utf8")) as JsonObject;
    } else {
        apiDocument = JSON.parse(readFileSync(apiJsonPath, "utf-8"));
    }

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
            customSiteTitle: "TriliumNext Internal API Documentation",
            customCss: '.swagger-ui .topbar { display: none }'
        })
    );
}
