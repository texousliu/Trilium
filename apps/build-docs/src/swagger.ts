import BuildContext from "./context";
import { join } from "path";
import { execSync } from "child_process";
import { mkdirSync } from "fs";

interface BuildInfo {
    specPath: string;
    outDir: string;
}

const buildInfos: BuildInfo[] = [
    {
        specPath: join(__dirname, "../../server/src/assets/api-openapi.yaml"),
        outDir: "api/internal"
    },
    {
        specPath: join(__dirname, "../../server/src/assets/etapi.openapi.yaml"),
        outDir: "api/etapi"
    }
];

export default function buildSwagger({ baseDir }: BuildContext) {
    for (const { specPath, outDir } of buildInfos) {
        const targetDir = join(baseDir, outDir);
        mkdirSync(outDir, { recursive: true });
        execSync(`pnpm redocly build-docs ${specPath} -o ${targetDir}/index.html`, { stdio: "inherit" });
    }
}
