import { t } from "../../../services/i18n";
import { isMobile, reloadFrontendApp } from "../../../services/utils";
import FormRadioGroup from "../../react/FormRadioGroup";
import { useTriliumOption } from "../../react/hooks";
import OptionsSection from "./components/OptionsSection";

export default function AppearanceSettings() {
    const [ layoutOrientation, setLayoutOrientation ] = useTriliumOption("layoutOrientation");

    return (
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
                currentValue={layoutOrientation} onChange={async (newValue) => {
                    await setLayoutOrientation(newValue);
                    reloadFrontendApp("layout orientation change");
                }}
            />}
        </OptionsSection>
    )
}