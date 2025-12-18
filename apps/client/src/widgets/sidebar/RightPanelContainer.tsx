//! This is currently only used for the new layout.
import "./RightPanelContainer.css";

import Split from "@triliumnext/split.js";
import { useEffect } from "preact/hooks";

import options from "../../services/options";
import { DEFAULT_GUTTER_SIZE } from "../../services/resizer";
import HighlightsList from "./HighlightsList";
import TableOfContents from "./TableOfContents";

const MIN_WIDTH_PERCENT = 5;

export default function RightPanelContainer() {
    // Split between right pane and the content pane.
    useEffect(() => {
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
    }, []);

    const items = [
        <TableOfContents />,
        <HighlightsList />
    ];

    // Split between items.
    useEffect(() => {
        const rightPaneContainer = document.getElementById("right-pane");
        const elements = Array.from(rightPaneContainer?.children ?? []) as HTMLElement[];
        console.log("Got ", elements);
        const splitInstance = Split(elements, {
            direction: "vertical"
        });
        return () => splitInstance.destroy();
    }, [ items ]);

    return (
        <div id="right-pane">
            {items}
        </div>
    );
}
