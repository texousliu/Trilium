import { t } from "../../../services/i18n";
import FormRadioGroup from "../../react/FormRadioGroup";
import { useTriliumOption } from "../../react/hooks";
import OptionsSection from "./components/OptionsSection";

export default function AppearanceSettings() {
    const [ layoutOrientation, setLayoutOrientation ] = useTriliumOption("layoutOrientation");
    console.log("Render with ", layoutOrientation);

    return (
        <OptionsSection title={t("theme.layout")}>
            <FormRadioGroup
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
            />
        </OptionsSection>
    )
}