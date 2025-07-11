import type { Application } from "express";
import swaggerUi from "swagger-ui-express";
import { join } from "path";
import yaml from "js-yaml";
import type { JsonObject } from "swagger-ui-express";
import { readFileSync, existsSync, readdirSync } from "fs";
import { RESOURCE_DIR } from "../services/resource_dir";
import log from "../services/log";

export default function register(app: Application) {
    log.info(`[DEBUG] Starting API docs registration`);
    log.info(`[DEBUG] RESOURCE_DIR: ${RESOURCE_DIR}`);
    
    // Clean trailing slashes from RESOURCE_DIR to prevent path resolution issues in packaged Electron apps
    const cleanResourceDir = RESOURCE_DIR.replace(/[\\\/]+$/, '');
    log.info(`[DEBUG] cleanResourceDir: ${cleanResourceDir}`);
    
    // Check what's in the resource directory
    try {
        if (existsSync(cleanResourceDir)) {
            const contents = readdirSync(cleanResourceDir);
            log.info(`[DEBUG] Contents of ${cleanResourceDir}: ${contents.join(', ')}`);
        } else {
            log.info(`[DEBUG] Resource directory doesn't exist: ${cleanResourceDir}`);
        }
    } catch (e) {
        log.error(`[DEBUG] Error reading resource directory: ${e}`);
    }
    
    // In packaged Electron apps, check if we need to read from the unpacked directory
    let resourceDir = cleanResourceDir;
    if (resourceDir.includes('app.asar')) {
        log.info(`[DEBUG] Detected ASAR packaging`);
        const unpackedDir = cleanResourceDir.replace('app.asar', 'app.asar.unpacked');
        log.info(`[DEBUG] Checking unpacked dir: ${unpackedDir}`);
        
        // Check what's in the unpacked directory
        try {
            if (existsSync(unpackedDir)) {
                const unpackedContents = readdirSync(unpackedDir);
                log.info(`[DEBUG] Contents of unpacked dir: ${unpackedContents.join(', ')}`);
                if (existsSync(join(unpackedDir, "etapi.openapi.yaml"))) {
                    resourceDir = unpackedDir;
                    log.info(`[DEBUG] Using unpacked directory: ${resourceDir}`);
                }
            } else {
                log.info(`[DEBUG] Unpacked directory doesn't exist: ${unpackedDir}`);
            }
        } catch (e) {
            log.error(`[DEBUG] Error checking unpacked directory: ${e}`);
        }
    }
    
    log.info(`[DEBUG] Final resourceDir: ${resourceDir}`);
    log.info(`[DEBUG] About to load OpenAPI specs...`);
    
    const etapiDocument = yaml.load(readFileSync(join(resourceDir, "etapi.openapi.yaml"), "utf8")) as JsonObject;
    const apiDocument = JSON.parse(readFileSync(join(resourceDir, "openapi.json"), "utf-8"));
    
    log.info(`[DEBUG] Successfully loaded OpenAPI documents`);
    log.info(`[DEBUG] About to register swagger-ui endpoints...`);

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
