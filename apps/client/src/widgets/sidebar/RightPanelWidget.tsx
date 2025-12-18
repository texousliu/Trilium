import clsx from "clsx";
import { ComponentChildren } from "preact";
import { useContext, useRef, useState } from "preact/hooks";

import { useTriliumOptionJson } from "../react/hooks";
import Icon from "../react/Icon";
import { ParentComponent } from "../react/react_utils";

interface RightPanelWidgetProps {
    id: string;
    title: string;
    children: ComponentChildren;
    buttons?: ComponentChildren;
}

export default function RightPanelWidget({ id, title, buttons, children }: RightPanelWidgetProps) {
    const [ rightPaneCollapsedItems, setRightPaneCollapsedItems ] = useTriliumOptionJson<string[]>("rightPaneCollapsedItems");
    const [ expanded, setExpanded ] = useState(!rightPaneCollapsedItems.includes(id));
    const containerRef = useRef<HTMLDivElement>(null);
    const parentComponent = useContext(ParentComponent);

    if (parentComponent) {
        parentComponent.initialized = Promise.resolve();
    }

    return (
        <div
            ref={containerRef}
            class={clsx("card widget", !expanded && "collapsed")}
        >
            <div
                class="card-header"
                onClick={() => {
                    const newExpanded = !expanded;
                    setExpanded(newExpanded);
                    const rightPaneCollapsedItemsSet = new Set(rightPaneCollapsedItems);
                    if (newExpanded) {
                        rightPaneCollapsedItemsSet.delete(id);
                    } else {
                        rightPaneCollapsedItemsSet.add(id);
                    }
                    if (rightPaneCollapsedItemsSet.size !== rightPaneCollapsedItems.length) {
                        setRightPaneCollapsedItems(Array.from(rightPaneCollapsedItemsSet));
                    }
                }}
            >
                <Icon
                    icon="bx bx-chevron-down"
                />
                <div class="card-header-title">{title}</div>
                <div class="card-header-buttons">{buttons}</div>
            </div>

            <div id={parentComponent?.componentId} class="body-wrapper">
                {expanded && <div class="card-body">
                    {children}
                </div>}
            </div>
        </div>
    );
}
