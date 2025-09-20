import { useEffect, useRef, useState } from "preact/hooks";
import { t } from "../../../services/i18n";
import SplitEditor, { PreviewButton, SplitEditorProps } from "./SplitEditor";
import { RawHtmlBlock } from "../../react/RawHtml";
import server from "../../../services/server";
import svgPanZoom, { zoomIn } from "svg-pan-zoom";
import { RefObject } from "preact";
import { useElementSize } from "../../react/hooks";

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
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Pan & zoom.
    const zoomRef = useResizer(containerRef, note.noteId, svg);

    return (
        <SplitEditor
            className="svg-editor"
            note={note}
            error={error}
            onContentChanged={onContentChanged}
            dataSaved={onSave}
            previewContent={(
                <RawHtmlBlock
                    className="render-container"
                    containerRef={containerRef}
                    html={svg}
                />
            )}
            previewButtons={
                <>
                    <PreviewButton
                        icon="bx bx-zoom-in"
                        text={t("relation_map_buttons.zoom_in_title")}
                        onClick={() => zoomRef.current?.zoomIn()}
                    />
                    <PreviewButton
                        icon="bx bx-zoom-out"
                        text={t("relation_map_buttons.zoom_out_title")}
                        onClick={() => zoomRef.current?.zoomOut()}
                    />
                    <PreviewButton
                        icon="bx bx-crop"
                        text={t("relation_map_buttons.reset_pan_zoom_title")}
                        onClick={() => zoomRef.current?.fit().center()}
                    />
                </>
            }
            {...props}
        />
    )
}

function useResizer(containerRef: RefObject<HTMLDivElement>, noteId: string, svg: string | undefined) {
    const lastPanZoom = useRef<{ pan: SvgPanZoom.Point, zoom: number }>();
    const lastNoteId = useRef<string>();
    const zoomRef = useRef<SvgPanZoom.Instance>();

    // Set up pan & zoom.
    useEffect(() => {
        const shouldPreservePanZoom = (lastNoteId.current === noteId);
        const svgEl = containerRef.current?.querySelector("svg");
        if (!svgEl) return;
        const zoomInstance = svgPanZoom(svgEl, {
            zoomEnabled: true,
            controlIconsEnabled: false
        });

        // Restore the previous pan/zoom if the user updates same note.
        if (shouldPreservePanZoom && lastPanZoom.current) {
            zoomInstance.zoom(lastPanZoom.current.zoom);
            zoomInstance.pan(lastPanZoom.current.pan);
        } else {
            zoomInstance.resize().center().fit();
        }

        lastNoteId.current = noteId;
        zoomRef.current = zoomInstance;

        return () => {
            lastPanZoom.current = {
                pan: zoomInstance.getPan(),
                zoom: zoomInstance.getZoom()
            }
            zoomInstance.destroy();
        };
    }, [ svg ]);

    // React to container changes.
    const width = useElementSize(containerRef);
    useEffect(() => {
        if (!zoomRef.current) return;
        zoomRef.current.resize().fit().center();
    }, [ width ]);

    return zoomRef;
}
