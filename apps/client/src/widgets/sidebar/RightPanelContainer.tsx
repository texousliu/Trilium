//! This is currently only used for the new layout.
import "./RightPanelContainer.css";

import Split from "@triliumnext/split.js";
import { createContext } from "preact";
import { useEffect, useRef } from "preact/hooks";

import options from "../../services/options";
import { DEFAULT_GUTTER_SIZE } from "../../services/resizer";
import HighlightsList from "./HighlightsList";
import TableOfContents from "./TableOfContents";

const MIN_WIDTH_PERCENT = 5;
const COLLAPSED_SIZE = 32;

export const RightPanelContext = createContext({
    setExpanded(cardEl: HTMLElement, expanded: boolean) {}
});

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
    const innerSplitRef = useRef<Split.Instance>(null);
    useEffect(() => {
        const rightPaneContainer = document.getElementById("right-pane");
        const elements = Array.from(rightPaneContainer?.children ?? []) as HTMLElement[];
        const splitInstance = Split(elements, {
            direction: "vertical",
            minSize: COLLAPSED_SIZE,
            gutterSize: 1
        });
        innerSplitRef.current = splitInstance;
        return () => splitInstance.destroy();
    }, [ items ]);

    const sizesBeforeCollapse = useRef(new WeakMap<HTMLElement, number>());

    return (
        <div id="right-pane">
            <RightPanelContext.Provider value={{
                setExpanded(cardEl, expanded) {
                    const splitInstance = innerSplitRef.current;
                    if (!splitInstance) return;

                    const rightPaneEl = document.getElementById("right-pane");
                    const children = Array.from(rightPaneEl?.querySelectorAll(":scope > .card") ?? []);
                    const pos = children.indexOf(cardEl);
                    if (pos === -1) return;
                    const sizes = splitInstance.getSizes();
                    if (!expanded) {
                        const sizeBeforeCollapse = sizes[pos];
                        sizesBeforeCollapse.current.set(cardEl, sizeBeforeCollapse);
                        sizes[pos] = 0;
                        const itemToExpand = pos > 0 ? pos - 1 : pos + 1;

                        if (sizes[itemToExpand] > COLLAPSED_SIZE) {
                            sizes[itemToExpand] += sizeBeforeCollapse;
                        }
                    } else {
                        const itemToExpand = pos > 0 ? pos - 1 : pos + 1;
                        const sizeBeforeCollapse = sizesBeforeCollapse.current.get(cardEl) ?? 50;

                        if (sizes[itemToExpand] > COLLAPSED_SIZE) {
                            sizes[itemToExpand] -= sizeBeforeCollapse;
                        }
                        sizes[pos] = sizeBeforeCollapse;
                    }
                    console.log("Set sizes to ", sizes);
                    splitInstance.setSizes(sizes);
                },
            }}>
                {items}
            </RightPanelContext.Provider>
        </div>
    );
}
