import { t } from "../../services/i18n";
import RightPanelWidget from "./RightPanelWidget";

export default function TableOfContents() {

    return (
        <RightPanelWidget title={t("toc.table_of_contents")}>
            Toc is here.
        </RightPanelWidget>
    );

}
