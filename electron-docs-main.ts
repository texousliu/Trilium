async function startElectron() {
    await import("./electron-main.js");
}

async function main() {
    await startElectron();
}

await main();
