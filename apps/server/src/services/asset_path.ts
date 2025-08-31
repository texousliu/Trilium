import packageJson from "../../package.json" with { type: "json" };
import { isDev } from "./utils";

export const assetUrlFragment = `assets/v${packageJson.version}`;
const assetPath = isDev ? assetUrlFragment + "/src" : assetUrlFragment;

export default assetPath;
