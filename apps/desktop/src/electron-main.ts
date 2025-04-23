import { initializeTranslations } from "@triliumnext/server/src/services/i18n.js";

async function main() {
    await initializeTranslations();
    (await import("./electron.js")).default();
}

main();
