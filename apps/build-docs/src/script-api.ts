import { execSync } from "child_process";
import BuildContext from "./context";

export default function buildScriptApi({ }: BuildContext) {
    for (const config of [ "backend", "frontend" ]) {
        execSync(`pnpm typedoc --options typedoc.${config}.json`, {
            stdio: "inherit"
            // * Output dir is set in typedoc.json.
        });
    }
}
