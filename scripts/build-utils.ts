import { execSync } from "child_process";
import { build as esbuild } from "esbuild";
import { rmSync } from "fs";
import { copySync, emptyDirSync, mkdirpSync } from "fs-extra";
import { join } from "path";

export default class BuildHelper {

    private rootDir: string;
    private projectDir: string;
    private outDir: string;

    constructor(projectPath: string) {
        this.rootDir = join(__dirname, "..");
        this.projectDir = join(this.rootDir, projectPath);
        this.outDir = join(this.projectDir, "dist");

        emptyDirSync(this.outDir);
    }

    copy(projectDirPath: string, outDirPath: string) {
        let sourcePath: string;
        if (projectDirPath.startsWith("/")) {
            sourcePath = join(this.rootDir, projectDirPath.substring(1));
        } else {
            sourcePath = join(this.projectDir, projectDirPath);
        }

        if (outDirPath.endsWith("/")) {
            mkdirpSync(join(outDirPath));
        }
        copySync(sourcePath, join(this.outDir, outDirPath), { dereference: true });
    }

    deleteFromOutput(path: string) {
        rmSync(join(this.outDir, path), { recursive: true });
    }

    async buildBackend(entryPoints: string[]) {
        await esbuild({
            entryPoints: entryPoints.map(e => join(this.projectDir, e)),
            tsconfig: join(this.projectDir, "tsconfig.app.json"),
            platform: "node",
            bundle: true,
            outdir: this.outDir,
            outExtension: {
                ".js": ".cjs"
            },
            format: "cjs",
            external: [
                "electron",
                "@electron/remote",
                "better-sqlite3",
                "./xhr-sync-worker.js",
                "vite"
            ],
            splitting: false,
            loader: {
                ".css": "text",
                ".ejs": "text"
            },
            define: {
                "process.env.NODE_ENV": JSON.stringify("production"),
            },
            minify: true
        });
    }

    triggerBuildAndCopyTo(projectToBuild: string, destPath: string) {
        const projectDir = join(this.rootDir, projectToBuild);
        execSync("pnpm build", { cwd: projectDir, stdio: "inherit" });
        copySync(join(projectDir, "dist"), join(this.projectDir, "dist", destPath));
    }

    copyNodeModules(nodeModules: string[]) {
        for (const module of nodeModules) {
            this.copy(`node_modules/${module}`, `node_modules/${module}/`);
        }
    }

}
