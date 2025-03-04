import i18next from "i18next";
import Backend from "i18next-fs-backend";
import options from "./options.js";
import sql_init from "./sql_init.js";
import { join } from "path";
import { getResourceDir } from "./utils.js";
import hidden_subtree from "./hidden_subtree.js";

export interface Locale {
    id: string;
    name: string;
    /** `true` if the language is a right-to-left one, or `false` if it's left-to-right. */
    rtl?: boolean;
}

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

export function getLocales(): Locale[] {
    // TODO: Currently hardcoded, needs to read the list of available languages.
    return [
        {
            id: "en",
            name: "English"
        },
        {
            id: "de",
            name: "Deutsch"
        },
        {
            id: "es",
            name: "Español"
        },
        {
            id: "fr",
            name: "Français"
        },
        {
            id: "cn",
            name: "简体中文"
        },
        {
            id: "tw",
            name: "繁體中文"
        },
        {
            id: "ro",
            name: "Română"
        },

        /*
         * Right to left languages
         *
         * Currently they are only for setting the language of text notes.
         */
        { // Arabic
            id: "ar",
            name: "اَلْعَرَبِيَّةُ",
            rtl: true
        },
        { // Hebrew
            id: "he",
            name: "עברית",
            rtl: true
        },
        { // Kurdish
            id: "ku",
            name: "کوردی",
            rtl: true
        },
        { // Persian
            id: "fa",
            name: "فارسی",
            rtl: true
        }
    ];
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

export async function changeLanguage(locale: string) {
    await i18next.changeLanguage(locale);
    hidden_subtree.checkHiddenSubtree(true, { restoreNames: true });
}
