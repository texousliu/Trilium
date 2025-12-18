//! This is currently only used for the new layout.
import "./RightPanelContainer.css";

import Split from "@triliumnext/split.js";
import { createContext } from "preact";
import { useEffect, useRef } from "preact/hooks";

import options from "../../services/options";
import { DEFAULT_GUTTER_SIZE } from "../../services/resizer";
import { clamp } from "../../services/utils";
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

                    const sizes = splitInstance.getSizes(); // percentages
                    const COLLAPSED_SIZE = 0; // keep your current behavior; consider a small min later

                    // Choose recipients/donors: nearest expanded panes first; if none, all except pos.
                    const recipients = getRecipientsByDistance(sizes, pos, COLLAPSED_SIZE);
                    const fallback = getExpandedIndices(sizes, pos, -Infinity); // all other panes
                    const targets = recipients.length ? recipients : fallback;

                    if (!expanded) {
                        const sizeBeforeCollapse = sizes[pos];
                        sizesBeforeCollapse.current.set(cardEl, sizeBeforeCollapse);

                        // Collapse
                        sizes[pos] = COLLAPSED_SIZE;

                        // Give freed space to other panes
                        const freed = sizeBeforeCollapse - COLLAPSED_SIZE;
                        distributeInto(sizes, targets, freed);
                    } else {
                        const want = sizesBeforeCollapse.current.get(cardEl) ?? 50;

                        // Take space back from other panes to expand this one
                        const took = takeFrom(sizes, targets, want);

                        sizes[pos] = COLLAPSED_SIZE + took; // if donors couldn't provide all, expand partially
                    }

                    // Optional: tiny cleanup to avoid negatives / floating drift
                    for (let i = 0; i < sizes.length; i++) sizes[i] = clamp(sizes[i], 0, 100);

                    // Normalize to sum to 100 (Split.js likes this)
                    const sum = sizes.reduce((a, b) => a + b, 0);
                    if (sum > 0) {
                        for (let i = 0; i < sizes.length; i++) sizes[i] = (sizes[i] / sum) * 100;
                    }

                    splitInstance.setSizes(sizes);
                }
            }}>
                {items}
            </RightPanelContext.Provider>
        </div>
    );
}

function getExpandedIndices(sizes, skipIndex, COLLAPSED_SIZE) {
    const idxs = [];
    for (let i = 0; i < sizes.length; i++) {
        if (i === skipIndex) continue;
        if (sizes[i] > COLLAPSED_SIZE) idxs.push(i);
    }
    return idxs;
}

// Prefer nearby panes (VS Code-ish). Falls back to "all expanded panes".
function getRecipientsByDistance(sizes, pos, COLLAPSED_SIZE) {
    const recipients = [];
    for (let d = 1; d < sizes.length; d++) {
        const left = pos - d;
        const right = pos + d;
        if (left >= 0 && sizes[left] > COLLAPSED_SIZE) recipients.push(left);
        if (right < sizes.length && sizes[right] > COLLAPSED_SIZE) recipients.push(right);
    }
    return recipients;
}

// Distribute `amount` into `recipients` proportionally to their current sizes.
function distributeInto(sizes, recipients, amount) {
    if (amount === 0 || recipients.length === 0) return;
    const total = recipients.reduce((sum, i) => sum + sizes[i], 0);
    if (total <= 0) {
    // equal split fallback
        const delta = amount / recipients.length;
        recipients.forEach(i => (sizes[i] += delta));
        return;
    }
    recipients.forEach(i => {
        const share = (sizes[i] / total) * amount;
        sizes[i] += share;
    });
}

// Take `amount` out of `donors` proportionally, without driving anyone below 0.
// Returns how much was actually taken.
function takeFrom(sizes, donors, amount) {
    if (amount <= 0 || donors.length === 0) return 0;

    // max each donor can contribute (don’t go below 0 here; you can change min if you want)
    const caps = donors.map(i => ({ i, cap: Math.max(0, sizes[i]) }));
    let remaining = amount;

    // iterative proportional take with caps
    for (let iter = 0; iter < 5 && remaining > 1e-9; iter++) {
        const active = caps.filter(x => x.cap > 1e-9);
        if (active.length === 0) break;

        const total = active.reduce((s, x) => s + sizes[x.i], 0) || active.length;
        for (const x of active) {
            const weight = total === active.length ? 1 / active.length : (sizes[x.i] / total);
            const want = remaining * weight;
            const took = Math.min(x.cap, want);
            sizes[x.i] -= took;
            x.cap -= took;
            remaining -= took;
            if (remaining <= 1e-9) break;
        }
    }
    return amount - remaining;
}
