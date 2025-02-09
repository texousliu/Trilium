import type { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const swaggerDocument = yaml.load(
    readFileSync(join(__dirname, "../etapi/etapi.openapi.yaml"), "utf8")
) as object;

function register(router: Router) {
    router.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerDocument, {
            explorer: true,
            customSiteTitle: "Trilium ETAPI Documentation"
        })
    );
}

export default {
    register
};
