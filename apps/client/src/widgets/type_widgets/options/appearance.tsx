import { useEffect, useState } from "preact/hooks";
import { t } from "../../../services/i18n";
import { isMobile, reloadFrontendApp } from "../../../services/utils";
import Column from "../../react/Column";
import FormRadioGroup from "../../react/FormRadioGroup";
import FormSelect from "../../react/FormSelect";
import { useTriliumOption, useTriliumOptionBool } from "../../react/hooks";
import OptionsSection from "./components/OptionsSection";
import server from "../../../services/server";
import FormCheckbox from "../../react/FormCheckbox";

interface Theme {
    val: string;
    title: string;
    noteId?: string;
}

const BUILTIN_THEMES: Theme[] = [
    { val: "next", title: t("theme.triliumnext") },
    { val: "next-light", title: t("theme.triliumnext-light") },
    { val: "next-dark", title: t("theme.triliumnext-dark") },
    { val: "auto", title: t("theme.auto_theme") },
    { val: "light", title: t("theme.light_theme") },
    { val: "dark", title: t("theme.dark_theme") }
]

export default function AppearanceSettings() {
    const [ layoutOrientation, setLayoutOrientation ] = useTriliumOption("layoutOrientation", true);
    const [ theme, setTheme ] = useTriliumOption("theme", true);
    const [ overrideThemeFonts, setOverrideThemeFonts ] = useTriliumOptionBool("overrideThemeFonts");

    const [ themes, setThemes ] = useState<Theme[]>([]);

    useEffect(() => {
        server.get<Theme[]>("options/user-themes").then((userThemes) => {
            setThemes([
                ...BUILTIN_THEMES,
                ...userThemes
            ])
        });
    }, []);

    return (
        <>
            <OptionsSection title={t("theme.layout")}>
                {!isMobile() && <FormRadioGroup
                    name="layout-orientation"
                    values={[
                        {
                            label: <><strong>{t("theme.layout-vertical-title")}</strong> - {t("theme.layout-vertical-description")}</>,
                            value: "vertical"
                        },
                        {
                            label: <><strong>{t("theme.layout-horizontal-title")}</strong> - {t("theme.layout-horizontal-description")}</>,
                            value: "horizontal"
                        }
                    ]}
                    currentValue={layoutOrientation} onChange={setLayoutOrientation}
                />}
            </OptionsSection>

            <OptionsSection title={t("theme.title")}>
                <Column>
                    <label>{t("theme.theme_label")}</label>
                    <FormSelect values={themes} currentValue={theme} onChange={setTheme} />
                </Column>

                <Column className="side-checkbox">
                    <FormCheckbox
                        name="override-theme-fonts"
                        label={t("theme.override_theme_fonts_label")}
                        currentValue={overrideThemeFonts} onChange={setOverrideThemeFonts} />
                </Column>
            </OptionsSection>
        </>
    )
}