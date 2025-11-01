import BuildContext from "./context";
import { join } from "path";
import { execSync } from "child_process";

export default function buildSwagger({ baseDir }: BuildContext) {
    const targetDir = join(baseDir, "api");
    const specPath = join(__dirname, "../../server/src/assets/api-openapi.yaml");

    execSync(`pnpm redocly build-docs ${specPath} -o ${targetDir}/internal-api.html`, { stdio: "inherit" });
}
