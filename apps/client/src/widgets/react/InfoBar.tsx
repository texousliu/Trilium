import { ComponentChildren } from "preact";

import "./InfoBar.css";

export type InfoBarParams = {
    type: "prominent" | "subtle",
    className: string;
    children: ComponentChildren;
};

export default function InfoBar(props: InfoBarParams) {
    return <div className={`info-bar ${props.className} info-bar-${props.type}`}>
        {props?.children}
    </div>
}

InfoBar.defaultProps = {
    type: "prominent"
} as InfoBarParams