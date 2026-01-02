import clsx from "clsx";

import { t } from "../../services/i18n";
import ActionButton from "../react/ActionButton";
import { useTriliumOptionBool } from "../react/hooks";
import { useState } from "preact/hooks";
import appContext from "../../components/app_context";
import { useTriliumEvent } from "../react/hooks";
import options from "../../services/options";

export default function RightPaneToggle() {
    const [rightPaneVisible, setRightPaneVisible] = useState(options.is("rightPaneVisible"));

    useTriliumEvent("toggleRightPane", () => {
        setRightPaneVisible(!rightPaneVisible);
    });

    return (
        <ActionButton
            className={clsx(
                `toggle-button right-pane-toggle-button bx-flip-horizontal`,
                rightPaneVisible ? "action-collapse" : "action-expand"
            )}
            text={t("right_pane.toggle")}
            icon="bx bx-sidebar"
            triggerCommand="toggleRightPane"
        />
    );
}
