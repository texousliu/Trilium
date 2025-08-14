import { useMemo } from "preact/hooks";
import { getAvailableLocales, t } from "../../../services/i18n";
import FormSelect from "../../react/FormSelect";
import OptionsRow from "./components/OptionsRow";
import OptionsSection from "./components/OptionsSection";
import { useTriliumOption } from "../../react/hooks";

export default function InternationalizationOptions() {
    return (
        <OptionsSection title={t("i18n.title")}>
            <LocalizationOptions />
        </OptionsSection>
    )
}

function LocalizationOptions() {
    const locales = useMemo(() =>
        getAvailableLocales().filter(locale => !locale.contentOnly)
    , []);

    const [ locale, setLocale ] = useTriliumOption("locale");

    return (
        <OptionsRow label={t("i18n.language")}>
            <FormSelect
                values={locales}
                keyProperty="id" titleProperty="name"                
                currentValue={locale} onChange={setLocale}
            />
        </OptionsRow>
    )
}