import { useContext } from "preact/hooks";
import ActionButton from "../react/ActionButton";
import { ParentComponent } from "../react/react_utils";
import { t } from "../../services/i18n";

export default function ToggleSidebarButton() {
    const parentComponent = useContext(ParentComponent);

    return (
        <ActionButton
            icon="bx bx-sidebar"
            text={t("note_tree.toggle-sidebar")}
            onClick={() => parentComponent?.triggerCommand("setActiveScreen", {
                screen: "tree"                
            })}
        />
    )
}
