import { useState } from "preact/hooks";
import Card from "../../components/Card";
import Section from "../../components/Section";
import { App, Architecture, buildDownloadUrl, downloadMatrix, DownloadMatrixEntry, getArchitecture, Platform } from "../../download-helper";
import "./download.css";
import { usePageTitle } from "../../hooks";
import Button, { Link } from "../../components/Button";

export default function DownloadPage() {
    const [ currentArch, setCurrentArch ] = useState(getArchitecture());
    usePageTitle("Download");

    return (
        <>
            <Section title="Download the desktop application" className="fill">
                <div className="architecture-switch">
                    <span>Architecture:</span>

                    <div class="toggle-wrapper">
                        {(["x64", "arm64"] as const).map(arch => (
                            <a
                                href="#"
                                className={`arch ${arch === currentArch ? "active" : ""}`}
                                onClick={() => setCurrentArch(arch)}
                            >{arch}</a>
                        ))}
                    </div>
                </div>

                <div className="grid-3-cols download-desktop">
                    {Object.entries(downloadMatrix.desktop).map(entry => <DownloadCard app="desktop" arch={currentArch} entry={entry} />)}
                </div>
            </Section>

            <Section title="Set up a server for access on multiple devices">
                <div className="grid-3-cols download-server">
                    {Object.entries(downloadMatrix.server).map(entry => <DownloadCard app="server" arch={currentArch} entry={entry} />)}
                </div>
            </Section>
        </>
    )
}

export function DownloadCard({ app, arch, entry: [ platform, entry ] }: { app: App, arch: Architecture, entry: [string, DownloadMatrixEntry] }) {
    function unwrapText(text: string | Record<Architecture, string>) {
        return (typeof text === "string" ? text : text[arch]);
    }

    const allDownloads = Object.entries(entry.downloads);
    const recommendedDownload = allDownloads.find(download => download[1].recommended);
    const restDownloads = allDownloads.filter(download => !download[1].recommended);

    return (
        <Card title={unwrapText(entry.title)} className="download-card">
            {unwrapText(entry.description)}

            <div class="download-options">
                <Button
                    className="recommended"
                    href={buildDownloadUrl(app, platform as Platform, recommendedDownload[0], arch)}
                    text={recommendedDownload[1].name}
                />

                <div class="other-options">
                    {restDownloads.map(download => (
                        <Link
                            href={buildDownloadUrl(app, platform as Platform, download[0], arch)}
                        >
                            {download[1].name}
                        </Link>
                    ))}
                </div>
            </div>
        </Card>
    )
}
