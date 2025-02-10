import type { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";

const __dirname = dirname(fileURLToPath(import.meta.url));
const swaggerDocument = yaml.load(
    await readFile(join(__dirname, "../etapi/etapi.openapi.yaml"), "utf8")
) as JsonObject;

function register(router: Router) {
    router.use(
        "/etapi",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            explorer: true,
            customSiteTitle: "TriliumNext ETAPI Documentation"
        })
    );
}

export default {
    register
};
