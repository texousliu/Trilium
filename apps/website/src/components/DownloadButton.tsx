import { getRecommendedDownload, RecommendedDownload } from "../download-helper.js";
import "./DownloadButton.css";
import Button from "./Button.js";
import downloadIcon from "../assets/boxicons/bx-arrow-in-down-square-half.svg?raw";
import packageJson from "../../../../package.json" with { type: "json" };
import { useEffect, useState } from "preact/hooks";

interface DownloadButtonProps {
    big?: boolean;
}

export default function DownloadButton({ big }: DownloadButtonProps) {
    const [ recommendedDownload, setRecommendedDownload ] = useState<RecommendedDownload | null>();
    useEffect(() => setRecommendedDownload(getRecommendedDownload()), []);

    return (recommendedDownload &&
        <Button
           className={`download-button desktop-only ${big ? "big" : ""}`}
           href={recommendedDownload.url}
           iconSvg={downloadIcon}
           text={<>
                Download now{" "}
                {big
                ? <span class="platform">v{packageJson.version} for {recommendedDownload.name}</span>
                : <span class="platform">for {recommendedDownload.name}</span>
                }
           </>}
        />
    )
}
