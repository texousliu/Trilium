interface RawHtmlProps {
    className?: string;
    html: string | HTMLElement;
}

export default function RawHtml({ className, html }: RawHtmlProps) {
    return <span
        className={className}
        dangerouslySetInnerHTML={getHtml(html)}
    />;
}

export function RawHtmlBlock({ className, html }: RawHtmlProps) {
    return <div
        className={className}
        dangerouslySetInnerHTML={getHtml(html)}
    />
}

function getHtml(html: string | HTMLElement) {
    if (typeof html !== "string") {
        html = html.outerHTML;
    }

    return {
        __html: html
    };
}