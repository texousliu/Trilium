import { describe, it } from "vitest";
import cls from "./cls.js";
import hiddenSubtreeService from "./hidden_subtree.js";
import sql_init from "./sql_init.js";
import branches from "./branches.js";
import becca from "../becca/becca.js";

describe("Hidden Subtree", () => {
    describe("Launcher movement persistence", () => {
        beforeAll(async () => {
            sql_init.initializeDb();
            await sql_init.dbReady;
            cls.init(() => hiddenSubtreeService.checkHiddenSubtree());
        });

        it("should persist launcher movement between visible and available after integrity check", async () => {
            // Move backend log to visible launchers.
            const backendLogBranch = becca.getBranchFromChildAndParent("_lbBackendLog", "_lbAvailableLaunchers");
            expect(backendLogBranch).toBeDefined();

            // Move launcher to visible launchers.
            cls.init(() => {
                branches.moveBranchToNote(backendLogBranch!, "_lbVisibleLaunchers");
                hiddenSubtreeService.checkHiddenSubtree();
            });

            // Ensure the launcher is still in visible launchers.
            const childBranches = backendLogBranch?.childNote.getParentBranches()
                .filter((b) => !b.isDeleted);
            expect(childBranches).toBeDefined();
            expect(childBranches![0].parentNoteId).toStrictEqual("_lbVisibleLaunchers");
        });
    });
});
