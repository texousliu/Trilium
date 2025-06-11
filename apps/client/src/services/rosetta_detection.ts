import utils from "./utils.js";

/**
 * Detects if the application is running under Rosetta 2 translation on Apple Silicon.
 * This happens when an x64 version of the app is run on an M1/M2/M3 Mac.
 * Uses the macOS sysctl.proc_translated to properly detect translation.
 * @returns true if running under Rosetta 2, false otherwise
 */
export function isRunningUnderRosetta2(): boolean {
    if (!utils.isElectron()) return false;

    const process = utils.dynamicRequire("process");
    const { execSync } = utils.dynamicRequire("child_process");

    // Only check on macOS
    if (process.platform !== "darwin") return false;

    try {
        // Use sysctl.proc_translated to check if process is being translated by Rosetta 2
        // This is the proper way to detect Rosetta 2 translation
        const result = execSync("sysctl -n sysctl.proc_translated 2>/dev/null", {
            encoding: "utf8",
            timeout: 1000
        }).trim();

        // Returns "1" if running under Rosetta 2, "0" if native ARM64
        // Returns empty string or error on Intel Macs (where the key doesn't exist)
        return result === "1";
    } catch (error) {
        // If the command fails (e.g., on Intel Macs), assume not running under Rosetta 2
        console.debug("Could not check Rosetta 2 status:", error);
        return false;
    }
}
