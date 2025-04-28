const child_process = require("child_process");
const { default: e } = require("express");
const fs = require("fs");
const path = require("path");

module.exports = function (sourcePath) {
    const { WINDOWS_SIGN_EXECUTABLE } = process.env;
    if (!WINDOWS_SIGN_EXECUTABLE) {
        console.warn("[Sign] Skip signing due to missing environment variable.");
        return;
    }    

    const buffer = fs.readFileSync(sourcePath);
    console.log("Platform: ", process.platform);
    console.log("CPU archi:", process.arch);
    console.log("DLL archi: ", getDllArchitectureFromBuffer(buffer));

    try {
        const command = `${WINDOWS_SIGN_EXECUTABLE} --executable "${sourcePath}"`;
        console.log(`[Sign] ${command}`);

        child_process.execSync(command);
    } catch (e) {
        console.error("[Sign] Got error while signing " + e.output.toString("utf-8"));
        process.exit(2); 
    }
}

function getDllArchitectureFromBuffer(buffer) {
    // Check for MZ header
    if (buffer[0] !== 0x4D || buffer[1] !== 0x5A) {
      return 'Not a PE file (missing MZ header)';
    }
  
    // Offset to PE header
    const peHeaderOffset = buffer.readUInt32LE(0x3C);
  
    // Confirm PE signature
    const peSig = buffer.toString('utf8', peHeaderOffset, peHeaderOffset + 4);
    if (peSig !== 'PE\u0000\u0000') {
      return 'Invalid PE header';
    }
  
    // Machine field is 2 bytes at PE header + 4
    const machine = buffer.readUInt16LE(peHeaderOffset + 4);
  
    const archMap = {
      0x014c: 'x86 (32-bit)',
      0x8664: 'x64 (64-bit)',
      0x01c4: 'ARM (32-bit)',
      0xaa64: 'ARM64',
    };
  
    return archMap[machine] || `Unknown (0x${machine.toString(16)})`;
  }