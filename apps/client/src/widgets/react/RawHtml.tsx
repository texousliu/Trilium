import { CSSProperties } from "preact/compat";

type HTMLElementLike = string | HTMLElement | JQuery<HTMLElement>;

interface RawHtmlProps {
    className?: string;
    html: HTMLElementLike;
    style?: CSSProperties;
}

export default function RawHtml({ className, html, style }: RawHtmlProps) {
    return <span
        className={className}
        dangerouslySetInnerHTML={getHtml(html)}
        style={style}
    />;
}

export function RawHtmlBlock({ className, html, style }: RawHtmlProps) {
    return <div
        className={className}
        dangerouslySetInnerHTML={getHtml(html)}
        style={style}
    />
}

function getHtml(html: string | HTMLElement | JQuery<HTMLElement>) {
    if (typeof html === "object" && "length" in html) {
        html = html[0];
    }

    if (typeof html === "object" && "outerHTML" in html) {
        html = html.outerHTML;
    }

    return {
        __html: html as string
    };
}