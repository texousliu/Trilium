//! This is currently only used for the new layout.
import "./RightPanelContainer.css";

import Split from "@triliumnext/split.js";
import { useEffect, useRef } from "preact/hooks";

import { t } from "../../services/i18n";
import options from "../../services/options";
import { DEFAULT_GUTTER_SIZE } from "../../services/resizer";
import BasicWidget from "../basic_widget";
import Button from "../react/Button";
import { useActiveNoteContext, useLegacyWidget, useNoteProperty, useTriliumOptionBool, useTriliumOptionJson } from "../react/hooks";
import Icon from "../react/Icon";
import LegacyRightPanelWidget from "../right_panel_widget";
import HighlightsList from "./HighlightsList";
import RightPanelWidget from "./RightPanelWidget";
import TableOfContents from "./TableOfContents";

const MIN_WIDTH_PERCENT = 5;

export default function RightPanelContainer({ customWidgets }: { customWidgets: BasicWidget[] }) {
    const [ rightPaneVisible, setRightPaneVisible ] = useTriliumOptionBool("rightPaneVisible");
    const [ highlightsList ] = useTriliumOptionJson<string[]>("highlightsList");
    useSplit(rightPaneVisible);

    const { note } = useActiveNoteContext();
    const noteType = useNoteProperty(note, "type");
    const items = (rightPaneVisible ? [
        (noteType === "text" || noteType === "doc") && <TableOfContents />,
        noteType === "text" && highlightsList.length > 0 && <HighlightsList />,
        ...customWidgets.map((w) => <CustomWidget key={w._noteId} originalWidget={w as LegacyRightPanelWidget} />)
    ] : []).filter(Boolean);

    return (
        <div id="right-pane">
            {rightPaneVisible && (
                items.length > 0 ? (
                    items
                ) : (
                    <div className="no-items">
                        <Icon icon="bx bx-sidebar" />
                        {t("right_pane.empty_message")}
                        <Button
                            text={t("right_pane.empty_button")}
                            onClick={() => setRightPaneVisible(!rightPaneVisible)}
                        />
                    </div>
                )
            )}
        </div>
    );
}

function useSplit(visible: boolean) {
    // Split between right pane and the content pane.
    useEffect(() => {
        if (!visible) return;

        // We are intentionally omitting useTriliumOption to avoid re-render due to size change.
        const rightPaneWidth = Math.max(MIN_WIDTH_PERCENT, options.getInt("rightPaneWidth") ?? MIN_WIDTH_PERCENT);
        const splitInstance = Split(["#center-pane", "#right-pane"], {
            sizes: [100 - rightPaneWidth, rightPaneWidth],
            gutterSize: DEFAULT_GUTTER_SIZE,
            minSize: [300, 180],
            rtl: glob.isRtl,
            onDragEnd: (sizes) => options.save("rightPaneWidth", Math.round(sizes[1]))
        });
        return () => splitInstance.destroy();
    }, [ visible ]);
}

function CustomWidget({ originalWidget }: { originalWidget: LegacyRightPanelWidget }) {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <RightPanelWidget
            id={originalWidget._noteId}
            title={originalWidget.widgetTitle}
            containerRef={containerRef}
        >
            <CustomWidgetContent originalWidget={originalWidget} />
        </RightPanelWidget>
    );
}

function CustomWidgetContent({ originalWidget }: { originalWidget: LegacyRightPanelWidget }) {
    const { noteContext } = useActiveNoteContext();
    const [ el ] = useLegacyWidget(() => {
        originalWidget.contentSized();

        // Monkey-patch the original widget by replacing the default initialization logic.
        originalWidget.doRender = function doRender(this: LegacyRightPanelWidget) {
            this.$widget = $("<div>");
            this.$body = this.$widget;
            const renderResult = this.doRenderBody();
            if (typeof renderResult === "object" && "catch" in renderResult) {
                this.initialized = renderResult.catch((e) => {
                    this.logRenderingError(e);
                });
            } else {
                this.initialized = Promise.resolve();
            }
        };

        return originalWidget;
    }, {
        noteContext
    });

    return el;
}
