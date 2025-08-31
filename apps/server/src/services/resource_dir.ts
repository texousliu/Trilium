import path from "path";
import fs from "fs";

import { getResourceDir } from "./utils.js";
export const RESOURCE_DIR = path.join(getResourceDir(), "assets");

// where the "trilium" executable is
const ELECTRON_APP_ROOT_DIR = path.resolve(RESOURCE_DIR, "../..");

export default {
    RESOURCE_DIR,
    ELECTRON_APP_ROOT_DIR
};
