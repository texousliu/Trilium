import options from "./options.js";
import i18next from "i18next";
import i18nextHttpBackend from "i18next-http-backend";
import server from "./server.js";

let locales: Locale[] | null;

// TODO: Deduplicate with server.
export interface Locale {
    id: string;
    name: string;
}

export async function initLocale() {
    const locale = (options.get("locale") as string) || "en";

    locales = await server.get<Locale[]>("options/locales");

    await i18next.use(i18nextHttpBackend).init({
        lng: locale,
        fallbackLng: "en",
        backend: {
            loadPath: `${window.glob.assetPath}/translations/{{lng}}/{{ns}}.json`
        },
        returnEmptyString: false
    });
}

export function getAvailableLocales() {
    if (!locales) {
        throw new Error("Tried to load list of locales, but localization is not yet initialized.");
    }

    return locales;
}

export const t = i18next.t;
export const getCurrentLanguage = () => i18next.language;
