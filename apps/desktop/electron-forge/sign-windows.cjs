const child_process = require("child_process");
const fs = require("fs");
const { default: path } = require("path");

module.exports = function (filePath) {
    const { WINDOWS_SIGN_EXECUTABLE } = process.env;

    if (!WINDOWS_SIGN_EXECUTABLE) {
        console.warn("[Sign] Skip signing due to missing environment variable.");
        return;
    }

    console.log(filePath, fs.realpathSync(filePath));
    filePath = fs.realpathSync(filePath);

    console.log(fs.readFileSync(filePath).subarray(0, 100));

    const command = `${WINDOWS_SIGN_EXECUTABLE} --executable "${filePath}"`;
    console.log(`[Sign] ${command}`);

    try {
        child_process.execSync(command);
    } catch (e) {
        console.error("[Sign] Got error while signing " + e.output.toString("utf-8"));
        process.exit(1);
    }
}