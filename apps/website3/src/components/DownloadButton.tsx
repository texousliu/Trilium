import { useLayoutEffect } from "preact/hooks";
import { getRecommendedDownload } from "../download-helper";

interface DownloadButtonProps {
    big?: boolean;
}

const { architecture, platform, url } = getRecommendedDownload();

export default function DownloadButton({ big }: DownloadButtonProps) {
    return (
        <a className={`download-button ${big ? "big" : ""}`} href={url}>
            Download now{" "}
            <span class="platform">{platform} {architecture}</span>
        </a>
    )
}
