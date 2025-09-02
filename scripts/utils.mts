import { readFileSync } from "fs";
import { platform } from "os";

export function isNixOS() {
    if (platform() !== "linux") return false;
    const osReleaseFile = readFileSync("/etc/os-release", "utf-8");
    return osReleaseFile.includes("ID=nixos");
}

export function resetPath() {
    // On Unix-like systems, PATH is usually inherited from login shell
    // but npm prepends node_modules/.bin. Let's remove it:
    const origPath = process.env.PATH || "";

    // npm usually adds something like ".../node_modules/.bin"
    process.env.PATH = origPath
        .split(":")
        .filter(p => !p.includes("node_modules/.bin"))
        .join(":");
}
