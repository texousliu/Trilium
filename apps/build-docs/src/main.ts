import { join } from "path";
import BuildContext from "./context";
import buildSwagger from "./swagger";
import { mkdirSync, rmSync } from "fs";

const context: BuildContext = {
    baseDir: join(__dirname, "../../../site")
};

function main() {
    // Clean input dir.
    rmSync(context.baseDir, { recursive: true });
    mkdirSync(context.baseDir);

    // Start building.
    buildSwagger(context);
}

main();
