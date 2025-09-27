import { getRecommendedDownload } from "../download-helper.js";
import "./DownloadButton.css";
import Button from "./Button.js";
import downloadIcon from "../assets/boxicons/bx-arrow-in-down-square-half.svg?raw";
import packageJson from "../../../../package.json" with { type: "json" };

interface DownloadButtonProps {
    big?: boolean;
}

const { name, url } = getRecommendedDownload();

export default function DownloadButton({ big }: DownloadButtonProps) {
    return (
        <Button
           className={`download-button desktop-only ${big ? "big" : ""}`}
           href={url}
           iconSvg={downloadIcon}
           text={<>
                Download now{" "}
                {big
                ? <span class="platform">v{packageJson.version} for {name}</span>
                : <span class="platform">for {name}</span>
                }
           </>}
        />
    )
}
