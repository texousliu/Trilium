import { describe, it } from "vitest";
import becca from "../becca/becca.js";
import sql from "./sql.js";
import migration from "./migration.js";
import cls from "./cls.js";

describe("Migration", () => {
    it("migrates from v214", async () => {
        return new Promise<void>((resolve) => {
            cls.init(async () => {
                sql.rebuildIntegrationTestDatabase("test/db/document_v214.db");
                await migration.migrateIfNecessary();
                resolve();
            });
        });
    });
});
