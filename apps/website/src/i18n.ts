import { default as i18next } from "i18next";
import HttpApi from 'i18next-http-backend';
import { initReactI18next } from "react-i18next";

interface Locale {
    id: string;
    name: string;
    rtl?: boolean;
}

export const LOCALES: Locale[] = [
    { id: "en", name: "English" },
    { id: "ro", name: "Română" },
    { id: "zh_TW", name: "繁體中文" },
    { id: "fr", name: "Français" },
    { id: "it", name: "Italiano" },
    { id: "ja", name: "日本語" },
    { id: "pl", name: "Polski" },
    { id: "es", name: "Español" },
    { id: "ar", name: "اَلْعَرَبِيَّةُ", rtl: true },
].toSorted((a, b) => a.name.localeCompare(b.name));

i18next
    .use(HttpApi)
    .use(initReactI18next);

await i18next.init({
    debug: true,
    lng: "en",
    fallbackLng: "en",
    backend: {
        loadPath: "/translations/{{lng}}/{{ns}}.json",
    },
    returnEmptyString: false
});
