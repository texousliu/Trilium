import { execSync } from "child_process";
import BuildContext from "./context";

export default function buildScriptApi({ }: BuildContext) {
    execSync(`pnpm typedoc`, {
        stdio: "inherit"
        // * Output dir is set in typedoc.json.
    });
}
