import { join } from "path";
import BuildHelper from "../../../scripts/build-utils";
import originalPackageJson from "../package.json" with { type: "json" };
import { writeFileSync } from "fs";

const build = new BuildHelper("apps/desktop");

async function main() {
    await build.buildBackend([ "src/main.ts"]);

    // Copy assets.
    build.copy("src/assets", "assets/");
    build.copy("/apps/server/src/assets", "assets/");
    build.copy("/packages/share-theme/src/templates", "share-theme/templates/");

    // Copy node modules dependencies
    build.copyNodeModules([ "better-sqlite3", "bindings", "file-uri-to-path", "@electron/remote" ]);
    build.copy("/apps/server/node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js", "xhr-sync-worker.js");

    // Integrate the client.
    build.triggerBuildAndCopyTo("apps/client", "public/");
    build.deleteFromOutput("public/webpack-stats.json");

    generatePackageJson();
}

function generatePackageJson() {
    const { version, author, license, description, dependencies, devDependencies } = originalPackageJson;
    const packageJson = {
        name: "trilium",
        main: "main.cjs",
        version, author, license, description,
        dependencies: {
            "better-sqlite3": dependencies["better-sqlite3"],
        },
        devDependencies: {
            electron: devDependencies.electron
        }
    };
    writeFileSync(join(build.outDir, "package.json"), JSON.stringify(packageJson, null, "\t"), "utf-8");
}

main();
