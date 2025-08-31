import { join } from "path";

const ASSET_ROOT_DIR = process.env.SERVER_ASSET_ROOT_DIR;
if (!ASSET_ROOT_DIR) {
    console.error("Missing SERVER_ASSET_ROOT_DIR env.");
    process.exit(1);
}

/** Contains database initialization data such as the demo database and the schema. */
export const DB_INIT_DIR = join(ASSET_ROOT_DIR, "db")
