import { t } from "../../../services/i18n";
import SplitEditor, { PreviewButton, SplitEditorProps } from "./SplitEditor";

export default function SvgSplitEditor(props: SplitEditorProps) {
    return (
        <SplitEditor
            error="Hi there"
            previewButtons={
                <>
                    <PreviewButton
                        icon="bx bx-zoom-in"
                        text={t("relation_map_buttons.zoom_in_title")}
                        onClick={() => {}}
                    />
                    <PreviewButton
                        icon="bx bx-zoom-out"
                        text={t("relation_map_buttons.zoom_out_title")}
                    />
                    <PreviewButton
                        icon="bx bx-crop"
                        text={t("relation_map_buttons.reset_pan_zoom_title")}
                    />
                </>
            }
            {...props}
        />
    )
}
