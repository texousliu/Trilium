import { ComponentChildren } from "preact";

import "./InfoBar.css";

export type InfoBarParams = {
    type: "prominent" | "subtle"
    children: ComponentChildren;
};

export default function InfoBar(props: InfoBarParams) {
    return <div className={`info-bar info-bar-${props.type}`}>
        {props?.children}
    </div>
}

InfoBar.defaultProps = {
    type: "prominent"
} as InfoBarParams