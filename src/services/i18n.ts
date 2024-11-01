import i18next from "i18next";
import Backend from "i18next-fs-backend";
import options from "./options.js";
import sql_init from "./sql_init.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import utils from "./utils.js";
import env from "./env.js";

export async function initializeTranslations() {
  const resourceDir = getResourceDir();

  // Initialize translations
  await i18next.use(Backend).init({
      lng: getCurrentLanguage(),
      fallbackLng: "en",
      ns: "server",
      backend: {
          loadPath: join(resourceDir, "translations/{{lng}}/{{ns}}.json")
      }
  });
}

function getResourceDir() {
  if (utils.isElectron() && !env.isDev()) {
    return process.resourcesPath;
  } else {
    return join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  }
}

function getCurrentLanguage() {
  let language;
  if (sql_init.isDbInitialized()) {
    language = options.getOptionOrNull("locale");  
  }

  if (!language) {
    console.info("Language option not found, falling back to en.");
    language = "en";
  }

  return language;
}

export function changeLanguage(locale: string) {
  return i18next.changeLanguage(locale);
}
