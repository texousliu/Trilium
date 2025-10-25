interface Locale {
    id: string;
    name: string;
    rtl?: boolean;
}

export const LOCALES: Locale[] = [
    { id: "en", name: "English" },
    { id: "ro", name: "Română" },
    { id: "zh-Hans", name: "简体中文" },
    { id: "zh-Hant", name: "繁體中文" },
    { id: "fr", name: "Français" },
    { id: "it", name: "Italiano" },
    { id: "ja", name: "日本語" },
    { id: "pl", name: "Polski" },
    { id: "es", name: "Español" },
    { id: "ar", name: "اَلْعَرَبِيَّةُ", rtl: true },
].toSorted((a, b) => a.name.localeCompare(b.name));

export function mapLocale(locale: string) {
    if (!locale) return 'en';
    const lower = locale.toLowerCase();

    if (lower.startsWith('zh')) {
        if (lower.includes('tw') || lower.includes('hk') || lower.includes('mo') || lower.includes('hant')) {
            return 'zh-Hant';
        }
        return 'zh-Hans';
    }

    // Default for everything else
    return locale.split('-')[0]; // e.g. "en-US" -> "en"
}
