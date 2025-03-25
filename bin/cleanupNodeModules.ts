import fs from "fs-extra";
import path from "path";

function main() {
    if (process.argv.length !== 3) {
        console.error("More than one path was supplied as argument. Aborting.");
        process.exit(1);
    }

    const basePath = process.argv[2];

    if (!fs.existsSync(basePath)) {
        console.error(`Supplied path '${basePath}' does not exist. Aborting.`)
        process.exit(1);
    }

    cleanupNodeModules(basePath);
}

function cleanupNodeModules(basePath: string) {
    const nodeDir = fs.readdirSync(path.join(basePath, "./node_modules"), { recursive: true, withFileTypes: true });
    //const libDir = fs.readdirSync(path.join(basePath, "./libraries"), { recursive: true, withFileTypes: true });

    /**
     * Delete unnecessary folders
     */
    const filterableDirs = new Set([
        "demo",
        "demos",
        "doc",
        "docs",
        "example",
        "examples",
        "test",
        "tests"
    ]);

    nodeDir
        .filter(el => el.isDirectory() && filterableDirs.has(el.name))
        .forEach(dir => fs.removeSync(path.join(dir.parentPath, dir.name)));


    /**
     * Delete unnecessary files based on file extension
     * TODO filter out useless (README).md files
     */
    const filterableFileExt = new Set([
        "ts",
        "map"
    ]);

    nodeDir
        // TriliumNextTODO: check if we can improve this naive file ext matching, without introducing any additional dependency
        .filter(el => el.isFile() && filterableFileExt.has(el.name.split(".").at(-1) || ""))
        .forEach(file => fs.removeSync(path.join(file.parentPath, file.name)));


    /**
     * Delete specific unnecessary folders
     * TODO: use basePath
     * TODO: check if we want removeSync to throw an error, if path does not exist anymore -> currently it will silently fail
     */
    const extraFoldersDelete = new Set([
        'build/node_modules/@excalidraw/excalidraw/dist/dev',
        'build/node_modules/boxicons/svg',
        'build/node_modules/boxicons/node_modules',
        'build/node_modules/boxicons/src',
        'build/node_modules/boxicons/iconjar',
        'build/node_modules/@jimp/plugin-print/fonts',
        'build/node_modules/jimp/dist/browser'
        // "node_modules/@excalidraw/excalidraw/dist/dev",
        // "node_modules/jimp/browser",
        // "node_modules/@jimp/plugin-print/fonts",
        // "node_modules/jimp/dist/browser",
        // "node_modules/jimp/fonts",
        // "node_modules/boxicons/svg",
        // "node_modules/boxicons/node_modules/react",
        // "node_modules/mermaid/dist/mermaid.js"
    ]);

    nodeDir
        .filter(el => el.isDirectory() && extraFoldersDelete.has(path.join(el.parentPath, el.name)))
        .forEach(dir => fs.removeSync(path.join(dir.parentPath, dir.name)))

}

main()