import "./Collapsible.css";

import clsx from "clsx";
import { ComponentChildren, HTMLAttributes } from "preact";
import { useRef, useState } from "preact/hooks";

import { useElementSize } from "./hooks";
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

    return (
        <div className={clsx("collapsible", className, expanded && "expanded")}>
            <div
                className="collapsible-title"
                onClick={() => setExpanded(!expanded)}
            >
                <Icon className="arrow" icon="bx bx-chevron-right" />&nbsp;
                {title}
            </div>

            <div
                ref={bodyRef}
                className="collapsible-body"
                style={{ height: expanded ? height : "0" }}
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
