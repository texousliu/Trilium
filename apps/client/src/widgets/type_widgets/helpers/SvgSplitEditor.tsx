import { useState } from "preact/hooks";
import { t } from "../../../services/i18n";
import SplitEditor, { PreviewButton, SplitEditorProps } from "./SplitEditor";
import { RawHtmlBlock } from "../../react/RawHtml";
import server from "../../../services/server";

interface SvgSplitEditorProps extends Omit<SplitEditorProps, "previewContent"> {
    /**
     * The name of the note attachment (without .svg extension) that will be used for storing the preview.
     */
    attachmentName: string;
    /**
     * Called upon when the SVG preview needs refreshing, such as when the editor has switched to a new note or the content has switched.
     *
     * The method must return a valid SVG string that will be automatically displayed in the preview.
     *
     * @param content the content of the note, in plain text.
     */
    renderSvg(content: string): string | Promise<string>;
}

export default function SvgSplitEditor({ note, attachmentName, renderSvg, ...props }: SvgSplitEditorProps) {
    const [ svg, setSvg ] = useState<string>();
    const [ error, setError ] = useState<string | null | undefined>();

    // Render the SVG.
    async function onContentChanged(content: string) {
        try {
            const svg = await renderSvg(content);

            // Rendering was successful.
            setError(null);
            setSvg(svg);
        } catch (e) {
            // Rendering failed.
            setError((e as Error)?.message);
        }
    }

    // Save as attachment.
    function onSave() {
        const payload = {
            role: "image",
            title: `${attachmentName}.svg`,
            mime: "image/svg+xml",
            content: svg,
            position: 0
        };

        server.post(`notes/${note.noteId}/attachments?matchBy=title`, payload);
    }

    return (
        <SplitEditor
            note={note}
            error={error}
            onContentChanged={onContentChanged}
            dataSaved={onSave}
            previewContent={(
                <RawHtmlBlock className="render-container" html={svg} />
            )}
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
