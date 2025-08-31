import packageJson from "../../package.json" with { type: "json" };

export const assetUrlFragment = `assets/v${packageJson.version}`;
const assetPath = assetUrlFragment;

export default assetPath;
