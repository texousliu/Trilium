import FNote from "../../entities/fnote";
import { t } from "../../services/i18n";
import { useNoteSavedData } from "../react/hooks";
import RightPanelWidget from "./RightPanelWidget";

export default function TableOfContents({ note }: { note: FNote }) {
    const content = useNoteSavedData(note.noteId);

    return (
        <RightPanelWidget title={t("toc.table_of_contents")}>
            {content?.length}
        </RightPanelWidget>
    );

}
