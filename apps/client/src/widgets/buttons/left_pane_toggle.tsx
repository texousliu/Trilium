import { useEffect, useState } from "preact/hooks";
import ActionButton from "../react/ActionButton";
import options from "../../services/options";
import { t } from "../../services/i18n";
import { useTriliumEvent } from "../react/hooks";
import resizer from "../../services/resizer";

export default function LeftPaneToggle({ isHorizontalLayout }: { isHorizontalLayout: boolean }) {
    const [ currentLeftPaneVisible, setCurrentLeftPaneVisible ] = useState(options.is("leftPaneVisible"));

    useTriliumEvent("setLeftPaneVisibility", ({ leftPaneVisible }) => {
        setCurrentLeftPaneVisible(leftPaneVisible ?? !currentLeftPaneVisible);
    });

    useEffect(() => {
        resizer.setupLeftPaneResizer(currentLeftPaneVisible);
    }, [ currentLeftPaneVisible ]);

    return (
        <ActionButton
            className={`${isHorizontalLayout ? "toggle-button" : "launcher-button"}`}
            text={currentLeftPaneVisible ? t("left_pane_toggle.hide_panel") : t("left_pane_toggle.show_panel")}
            triggerCommand={currentLeftPaneVisible ? "hideLeftPane" : "showLeftPane"}
            icon={isHorizontalLayout
                ? "bx bx-sidebar"
                : (currentLeftPaneVisible ? "bx bx-chevrons-left" : "bx bx-chevrons-right" )}
        />
    )
}