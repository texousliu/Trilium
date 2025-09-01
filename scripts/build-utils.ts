import { rmSync } from "fs";
import { copySync, emptyDirSync, mkdirpSync } from "fs-extra";
import { join } from "path";

export default class BuildHelper {

    private projectDir: string;
    private outDir: string;

    constructor(projectPath: string) {
        this.projectDir = join(__dirname, "..", projectPath);
        this.outDir = join(this.projectDir, "dist");

        emptyDirSync(this.outDir);
    }

    copy(projectDirPath: string, outDirPath: string) {
        if (outDirPath.endsWith("/")) {
            mkdirpSync(join(outDirPath));
        }
        copySync(join(this.projectDir, projectDirPath), join(this.outDir, outDirPath), { dereference: true });
    }

    deleteFromOutput(path: string) {
        rmSync(join(this.outDir, path), { recursive: true });
    }

}
