import clsx from "clsx";

import { t } from "../../services/i18n";
import ActionButton from "../react/ActionButton";
import { useTriliumOptionBool } from "../react/hooks";
import { useState } from "preact/hooks";
import appContext from "../../components/app_context";

export default function RightPaneToggle() {
    const [rightPaneVisibleOption, setRightPaneVisibleOption] = useTriliumOptionBool("rightPaneVisible");
    const [rightPaneVisible, setRightPaneVisible] = useState(rightPaneVisibleOption);

    return (
        <ActionButton
            className={clsx(
                `toggle-button right-pane-toggle-button bx-flip-horizontal`,
                rightPaneVisible ? "action-collapse" : "action-expand"
            )}
            text={t("right_pane.toggle")}
            icon="bx bx-sidebar"
            onClick={() => {
                setRightPaneVisible(!rightPaneVisible);
                setRightPaneVisibleOption(!rightPaneVisible);
                appContext.triggerEvent("toggleRightPane", {});
            }}
        />
    );
}
