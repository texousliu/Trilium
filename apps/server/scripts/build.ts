import BuildHelper from "../../../scripts/build-utils";

const build = new BuildHelper("apps/server");

async function main() {
    await build.buildBackend([ "src/main.ts", "src/docker_healthcheck.ts" ])

    // Copy assets
    build.copy("src/assets", "assets/");
    build.copy("/packages/share-theme/src/templates", "share-theme/templates/");

    // Copy node modules dependencies
    build.copyNodeModules([ "better-sqlite3", "bindings", "file-uri-to-path" ]);
    build.copy("/node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js", "xhr-sync-worker.js");

    // Integrate the client.
    build.triggerBuildAndCopyTo("apps/client", "public/");
    build.deleteFromOutput("public/webpack-stats.json");
}

main();
