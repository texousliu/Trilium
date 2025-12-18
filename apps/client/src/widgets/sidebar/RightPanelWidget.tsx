import clsx from "clsx";
import { ComponentChildren } from "preact";
import { useContext, useRef, useState } from "preact/hooks";

import Icon from "../react/Icon";
import { ParentComponent } from "../react/react_utils";

interface RightPanelWidgetProps {
    title: string;
    children: ComponentChildren;
    buttons?: ComponentChildren;
}

export default function RightPanelWidget({ title, buttons, children }: RightPanelWidgetProps) {
    const [ expanded, setExpanded ] = useState(true);
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
            <div class="card-header">
                <Icon
                    icon="bx bx-chevron-down"
                    onClick={() => {
                        setExpanded(!expanded);
                    }}
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
