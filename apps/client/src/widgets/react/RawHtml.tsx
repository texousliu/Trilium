interface RawHtmlProps {
    html: string;
}

export default function RawHtml({ html }: RawHtmlProps) {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}