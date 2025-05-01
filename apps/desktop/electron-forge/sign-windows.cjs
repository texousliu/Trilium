const child_process = require("child_process");
const path = require("path");
const { WINDOWS_SIGN_EXECUTABLE } = process.env;

function sign(sourcePath) {
    if (!WINDOWS_SIGN_EXECUTABLE) {
        console.warn("[Sign] Skip signing due to missing environment variable.");
        return;
    }

    if (path.extname(sourcePath) !== ".exe") {
        console.warn("[Sign] Unsupported extension for signing: ", sourcePath);
        return;
    }

    try {
        const command = `${WINDOWS_SIGN_EXECUTABLE} --executable "${sourcePath}"`;
        console.log(`[Sign] ${command}`);
        child_process.execSync(command);
    } catch (e) {
        console.error("[Sign] Got error while signing " + e.output.toString("utf-8"));
        printSigningErrorLogs();
    }
}

function printSigningErrorLogs() {
    const logLocation = path.join(path.dirname(WINDOWS_SIGN_EXECUTABLE), "ev_signer_trilium.err.log");

    if (!fs.existsSync(logLocation)) {
        console.warn("[Sign] No debug log file found.");
        return;
    }

    const logContent = fs.readFileSync(logLocation, "utf-8");
    console.error("[Sign] Debug log content:\n" + logContent);
}

module.exports = sign;
