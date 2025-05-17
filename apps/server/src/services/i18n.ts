import i18next from "i18next";
import options from "./options.js";
import sql_init from "./sql_init.js";
import { join } from "path";
import { getResourceDir } from "./utils.js";
import hidden_subtree from "./hidden_subtree.js";
import { LOCALES, type Locale } from "@triliumnext/commons";
import dayjs, { Dayjs } from "dayjs";

const DAYJS_LOCALE_MAP: Record<string, string> = {
    cn: "zh-cn",
    tw: "zh-tw"
};

let dayjsLocale: string;

export async function initializeTranslations() {
    const resourceDir = getResourceDir();
    const Backend = (await import("i18next-fs-backend")).default;
    const locale = getCurrentLanguage();

    // Initialize translations
    await i18next.use(Backend).init({
        lng: locale,
        fallbackLng: "en",
        ns: "server",
        backend: {
            loadPath: join(resourceDir, "assets/translations/{{lng}}/{{ns}}.json")
        }
    });

    // Initialize dayjs locale.
    dayjsLocale = DAYJS_LOCALE_MAP[locale] ?? locale;
    try {
        await import(`dayjs/locale/${dayjsLocale}.js`);
    } catch (err) {
        console.warn(`Could not load locale ${dayjsLocale}`, err);
    }
    dayjs.locale(dayjsLocale);
}

export function ordinal(date: Dayjs) {
    return dayjs(date)
        .format("Do");
}

export function getLocales(): Locale[] {
    return LOCALES;
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
