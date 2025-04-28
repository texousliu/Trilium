const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports = function (sourcePath) {
    const { WINDOWS_SIGN_EXECUTABLE } = process.env;

    if (!WINDOWS_SIGN_EXECUTABLE) {
        console.warn("[Sign] Skip signing due to missing environment variable.");
        return;
    }

    const destPath = path.resolve(path.basename(sourcePath));
    try {
        fs.copyFileSync(sourcePath, destPath);        
    } catch (e) {
        console.error(`Unable to copy ${sourcePath} -> ${destPath}: ${e.message}`);
        process.exit(1);
    }

    const command = `${WINDOWS_SIGN_EXECUTABLE} --executable "${destPath}"`;
    console.log(`[Sign] ${command}`);

    try {
        child_process.execSync(command);
    } catch (e) {
        console.error("[Sign] Got error while signing " + e.output.toString("utf-8"));
        process.exit(2); 
    } finally {
        fs.rmSync(destPath);
    }
}