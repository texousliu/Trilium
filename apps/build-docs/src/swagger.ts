import { getAbsoluteFSPath } from "swagger-ui-dist";
import BuildContext from "./context";
import { cpSync, mkdirSync } from "fs";
import { join } from "path";

export default function buildSwagger({ baseDir }: BuildContext) {
    const absolutePath = getAbsoluteFSPath();
    const targetDir = join(baseDir, "api");
    cpSync(absolutePath, targetDir, { recursive: true });
}
