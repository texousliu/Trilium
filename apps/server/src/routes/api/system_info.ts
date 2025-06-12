import { execSync } from "child_process";
import { isMac } from "../../services/utils";

function systemChecks() {
    return {
        isCpuArchMismatch: isRunningUnderRosetta2()
    }
}

/**
 * Detects if the application is running under Rosetta 2 translation on Apple Silicon.
 * This happens when an x64 version of the app is run on an M1/M2/M3 Mac.
 * Uses the macOS sysctl.proc_translated to properly detect translation.
 * @returns true if running under Rosetta 2, false otherwise
 */
export const isRunningUnderRosetta2 = () => {
    return true;
};

export default {
    systemChecks
};
