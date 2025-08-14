import { useMemo } from "preact/hooks";
import { getAvailableLocales, t } from "../../../services/i18n";
import FormSelect from "../../react/FormSelect";
import OptionsRow from "./components/OptionsRow";
import OptionsSection from "./components/OptionsSection";
import { useTriliumOption } from "../../react/hooks";
import type { Locale } from "@triliumnext/commons";
import { isElectron } from "../../../services/utils";

export default function InternationalizationOptions() {
    return (
        <>
            <LocalizationOptions />
        </>
    )
}

function LocalizationOptions() {
    const { uiLocales, formattingLocales: contentLocales } = useMemo(() => {
        const allLocales = getAvailableLocales();        
        return {
            uiLocales: allLocales.filter(locale => !locale.contentOnly),
            formattingLocales: allLocales.filter(locale => locale.electronLocale),
        }
    }, []);

    const [ locale, setLocale ] = useTriliumOption("locale");
    const [ formattingLocale, setFormattingLocale ] = useTriliumOption("formattingLocale");

    return (
        <OptionsSection title={t("i18n.title")}>
            <OptionsRow label={t("i18n.language")}>
                <LocaleSelector locales={uiLocales} currentValue={locale} onChange={setLocale} />
            </OptionsRow>

            {isElectron() && <OptionsRow label={t("i18n.formatting-locale")}>
                <LocaleSelector locales={contentLocales} currentValue={formattingLocale} onChange={setFormattingLocale} />
            </OptionsRow>}
        </OptionsSection>
    )
}

function LocaleSelector({ locales, currentValue, onChange }: { locales: Locale[], currentValue: string, onChange: (newLocale: string) => void }) {
    return <FormSelect
        values={locales}
        keyProperty="id" titleProperty="name"                
        currentValue={currentValue} onChange={onChange}
    />;
}