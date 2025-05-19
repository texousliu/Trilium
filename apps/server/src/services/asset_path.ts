import packageJson from "../../package.json" with { type: "json" };
import { isDev } from "./utils";

const assetPath = isDev ? `http://localhost:4200/assets/v${packageJson.version}` : `assets/v${packageJson.version}`;

export default assetPath;
