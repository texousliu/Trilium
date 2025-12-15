import "./Collapsible.css";

import clsx from "clsx";
import { ComponentChildren, HTMLAttributes } from "preact";
import { useRef, useState } from "preact/hooks";

import { useElementSize, useUniqueName } from "./hooks";
import Icon from "./Icon";

interface CollapsibleProps extends Pick<HTMLAttributes<HTMLDivElement>, "className"> {
    title: string;
    children: ComponentChildren;
    initiallyExpanded?: boolean;
}

export default function Collapsible({ title, children, className, initiallyExpanded }: CollapsibleProps) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [ expanded, setExpanded ] = useState(initiallyExpanded);
    const { height } = useElementSize(innerRef) ?? {};
    const contentId = useUniqueName();

    return (
        <div className={clsx("collapsible", className, expanded && "expanded")}>
            <button
                className="collapsible-title"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-controls={contentId}
            >
                <Icon className="arrow" icon="bx bx-chevron-right" />&nbsp;
                {title}
            </button>

            <div
                id={contentId}
                ref={bodyRef}
                className="collapsible-body"
                style={{ height: expanded ? height : "0" }}
                aria-hidden={!expanded}
            >
                <div
                    ref={innerRef}
                    className="collapsible-inner-body"
                >
                    {children}
                </div>
            </div>
        </div>
    );

}
