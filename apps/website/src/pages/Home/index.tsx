import { ComponentChildren } from 'preact';
import Card from '../../components/Card.js';
import Section from '../../components/Section.js';
import DownloadButton from '../../components/DownloadButton.js';
import "./index.css";
import { useColorScheme, usePageTitle } from '../../hooks.js';
import Button, { Link } from '../../components/Button.js';
import gitHubIcon from "../../assets/boxicons/bx-github.svg?raw";
import dockerIcon from "../../assets/boxicons/bx-docker.svg?raw";
import noteStructureIcon from "../../assets/boxicons/bx-folder.svg?raw";
import attributesIcon from "../../assets/boxicons/bx-tag.svg?raw";
import hoistingIcon from "../../assets/boxicons/bx-chevrons-up.svg?raw";
import revisionsIcon from "../../assets/boxicons/bx-history.svg?raw";
import syncIcon from "../../assets/boxicons/bx-refresh-cw.svg?raw";
import protectedNotesIcon from "../../assets/boxicons/bx-shield.svg?raw";
import jumpToIcon from "../../assets/boxicons/bx-send-alt.svg?raw";
import searchIcon from "../../assets/boxicons/bx-search.svg?raw";
import webClipperIcon from "../../assets/boxicons/bx-paperclip.svg?raw";
import importExportIcon from "../../assets/boxicons/bx-swap-horizontal.svg?raw";
import shareIcon from "../../assets/boxicons/bx-globe.svg?raw";
import codeIcon from "../../assets/boxicons/bx-code.svg?raw";
import restApiIcon from "../../assets/boxicons/bx-extension.svg?raw";
import textNoteIcon from "../../assets/boxicons/bx-note.svg?raw";
import fileIcon from "../../assets/boxicons/bx-file.svg?raw";
import canvasIcon from "../../assets/boxicons/bx-pen.svg?raw";
import mermaidIcon from "../../assets/boxicons/bx-vector-square.svg?raw";
import mindmapIcon from "../../assets/boxicons/bx-network-chart.svg?raw";
import calendarIcon from "../../assets/boxicons/bx-calendar.svg?raw";
import tableIcon from "../../assets/boxicons/bx-table.svg?raw";
import boardIcon from "../../assets/boxicons/bx-columns-3.svg?raw";
import geomapIcon from "../../assets/boxicons/bx-map.svg?raw";
import { getPlatform } from '../../download-helper.js';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n.js';

export function Home() {
    usePageTitle("");

	return (
        <>
            <HeroSection />
            <OrganizationBenefitsSection />
            <ProductivityBenefitsSection />
            <NoteTypesSection />
            <ExtensibilityBenefitsSection />
            <CollectionsSection />
            <FaqSection />
            <FinalCta />
        </>
	);
}

function HeroSection() {
    const platform = getPlatform();
    const colorScheme = useColorScheme();
    const [ screenshotUrl, setScreenshotUrl ] = useState<string>();

    useEffect(() => {
        switch (platform) {
            case "macos":
                setScreenshotUrl(`/screenshot_desktop_mac_${colorScheme}.webp`);
                break;
            case "linux":
                setScreenshotUrl(`/screenshot_desktop_linux_${colorScheme}.webp`);
                break;
            case "windows":
            default:
                setScreenshotUrl(`/screenshot_desktop_win_${colorScheme}.webp`);
                break;
        }
    }, [ colorScheme ]);

    return (
        <Section className="hero-section">
            <div class="title-section">
                <h1>{t("hero_section.title")}</h1>
                <p>{t("hero_section.subtitle")}</p>

                <div className="download-wrapper">
                    <DownloadButton big />
                    <Button href="./get-started/" className="mobile-only" text={t("hero_section.get_started")} />
                    <div className="additional-options">
                        <Button iconSvg={gitHubIcon} outline text={t("hero_section.github")} href="https://github.com/TriliumNext/Trilium/" openExternally />
                        <Button iconSvg={dockerIcon} outline text={t("hero_section.dockerhub")} href="https://hub.docker.com/r/triliumnext/trilium" openExternally />
                    </div>
                </div>

            </div>

            <div className="screenshot-container">
                {screenshotUrl && <img class="screenshot" src={screenshotUrl} alt={t("hero_section.screenshot_alt")} />}
            </div>
        </Section>
    )
}

function OrganizationBenefitsSection() {
    return (
        <>
            <Section className="benefits" title={t("organization_benefits.title")}>
                <div className="benefits-container grid-3-cols">
                    <Card iconSvg={noteStructureIcon} title={t("organization_benefits.note_structure_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Notes/index.html">{t("organization_benefits.note_structure_description")}</Card>
                    <Card iconSvg={attributesIcon} title={t("organization_benefits.attributes_title")} moreInfoUrl="https://docs.triliumnotes.org/User Guide/User Guide/Advanced Usage/Attributes/index.html">{t("organization_benefits.attributes_description")}</Card>
                    <Card iconSvg={hoistingIcon} title={t("organization_benefits.hoisting_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Navigation/Note%20Hoisting.html">{t("organization_benefits.hoisting_description")}</Card>
                </div>
            </Section>
        </>
    );
}

function ProductivityBenefitsSection() {
    return (
        <>
            <Section className="benefits accented" title={t("productivity_benefits.title")}>
                <div className="benefits-container grid-3-cols">
                    <Card iconSvg={revisionsIcon} title={t("productivity_benefits.revisions_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Notes/Note%20Revisions.html">{t("productivity_benefits.revisions_content")}</Card>
                    <Card iconSvg={syncIcon} title={t("productivity_benefits.sync_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Installation%20%26%20Setup/Synchronization.html">{t("productivity_benefits.sync_content")}</Card>
                    <Card iconSvg={protectedNotesIcon} title={t("productivity_benefits.protected_notes_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Notes/Protected%20Notes.html">{t("productivity_benefits.protected_notes_content")}</Card>
                    <Card iconSvg={jumpToIcon} title={t("productivity_benefits.jump_to_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Navigation/Jump%20to.html">{t("productivity_benefits.jump_to_content")}</Card>
                    <Card iconSvg={searchIcon} title={t("productivity_benefits.search_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Navigation/Search.html">{t("productivity_benefits.search_content")}</Card>
                    <Card iconSvg={webClipperIcon} title={t("productivity_benefits.web_clipper_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Installation%20%26%20Setup/Web%20Clipper.html">{t("productivity_benefits.web_clipper_content")}</Card>
                </div>
            </Section>
        </>
    );
}

function NoteTypesSection() {
    return (
        <Section className="note-types" title="Multiple ways to represent your information">
            <ListWithScreenshot horizontal items={[
                {
                    title: t("note_types.text_title"),
                    imageUrl: "/type_text.webp",
                    iconSvg: textNoteIcon,
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Text/index.html",
                    description: t("note_types.text_description")
                },
                {
                    title: t("note_types.code_title"),
                    imageUrl: "/type_code.webp",
                    iconSvg: codeIcon,
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Code.html",
                    description: t("note_types.code_description")
                },
                {
                    title: t("note_types.file_title"),
                    imageUrl: "/type_file.webp",
                    iconSvg: fileIcon,
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/File.html",
                    description: t("note_types.file_description")
                },
                {
                    title: t("note_types.canvas_title"),
                    imageUrl: "/type_canvas.webp",
                    iconSvg: canvasIcon,
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Canvas.html",
                    description: t("note_types.canvas_description")
                },
                {
                    title: t("note_types.mermaid_title"),
                    imageUrl: "/type_mermaid.webp",
                    iconSvg: mermaidIcon,
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Mermaid%20Diagrams/index.html",
                    description: t("note_types.mermaid_description")
                },
                {
                    title: t("note_types.mindmap_title"),
                    imageUrl: "/type_mindmap.webp",
                    iconSvg: mindmapIcon,
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Mind%20Map.html",
                    description: t("note_types.mindmap_description")
                }
            ]} />
            <p>
                {t("note_types.others_prefix")}
                <Link href="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Note%20Map.html" openExternally>{t("note_types.others_note_map")}</Link>{t("note_types.others_separator")}
                <Link href="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Relation%20Map.html" openExternally>{t("note_types.others_relation_map")}</Link>{t("note_types.others_separator")}
                <Link href="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Saved%20Search.html" openExternally>{t("note_types.others_saved_searches")}</Link>{t("note_types.others_separator")}
                <Link href="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Render%20Note.html" openExternally>{t("note_types.others_render_note")}</Link>{t("note_types.others_separator")}
                <Link href="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Web%20View.html" openExternally>{t("note_types.others_webview")}</Link>.
            </p>
        </Section>
    );
}

function ExtensibilityBenefitsSection() {
    return (
        <>
            <Section className="benefits accented" title={t("extensibility_benefits.title")}>
                <div className="benefits-container grid-4-cols">
                    <Card iconSvg={importExportIcon} title={t("extensibility_benefits.import_export_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Basic%20Concepts%20and%20Features/Import%20%26%20Export/Markdown/index.html">{t("extensibility_benefits.import_export_description")}</Card>
                    <Card iconSvg={shareIcon} title={t("extensibility_benefits.share_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Advanced%20Usage/Sharing/Serving%20directly%20the%20content%20o.html">{t("extensibility_benefits.share_description")}</Card>
                    <Card iconSvg={codeIcon} title={t("extensibility_benefits.scripting_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Scripting/Custom%20Widgets/index.html">{t("extensibility_benefits.scripting_description")}</Card>
                    <Card iconSvg={restApiIcon} title={t("extensibility_benefits.api_title")} moreInfoUrl="https://docs.triliumnotes.org/User%20Guide/User%20Guide/Advanced%20Usage/ETAPI%20%28REST%20API%29/index.html">{t("extensibility_benefits.api_description")}</Card>
                </div>
            </Section>
        </>
    );
}

function CollectionsSection() {
    return (
        <Section className="collections" title="Collections">
            <ListWithScreenshot items={[
                {
                    title: t("collections.calendar_title"),
                    imageUrl: "/collection_calendar.webp",
                    iconSvg: calendarIcon,
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Collections/Calendar%20View.html",
                    description: t("collections.calendar_description")
                },
                {
                    title: t("collections.table_title"),
                    iconSvg: tableIcon,
                    imageUrl: "/collection_table.webp",
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Collections/Table%20View.html",
                    description: t("collections.calendar_description")
                },
                {
                    title: t("collections.board_title"),
                    iconSvg: boardIcon,
                    imageUrl: "/collection_board.webp",
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Collections/Board%20View.html",
                    description: t("collections.board_description")
                },
                {
                    title: t("collections.geomap_title"),
                    iconSvg: geomapIcon,
                    imageUrl: "/collection_geomap.webp",
                    moreInfo: "https://docs.triliumnotes.org/User%20Guide/User%20Guide/Note%20Types/Collections/Geo%20Map%20View.html",
                    description: t("collections.geomap_description")
                }
            ]} />
        </Section>
    );
}

function ListWithScreenshot({ items, horizontal, cardExtra }: {
    items: { title: string, imageUrl: string, description: string, moreInfo: string, iconSvg?: string }[];
    horizontal?: boolean;
    cardExtra?: ComponentChildren;
}) {
    const [ selectedItem, setSelectedItem ] = useState(items[0]);

    return (
        <div className={`list-with-screenshot ${horizontal ? "horizontal" : ""}`}>
            <ul>
                {items.map(item => (
                    <li className={`${item === selectedItem ? "selected" : ""}`}>
                        <Card
                            title={item.title}
                            onMouseEnter={() => setSelectedItem(item)}
                            onClick={() => setSelectedItem(item)}
                            moreInfoUrl={item.moreInfo}
                            iconSvg={item.iconSvg}
                        >
                            {item.description}
                        </Card>
                    </li>
                ))}
            </ul>

            <div className="details">
                {selectedItem && (
                    <>
                        <img src={selectedItem.imageUrl} alt="Screenshot of the feature being selected" loading="lazy" />
                    </>
                )}
            </div>
        </div>
    )
}

function FaqSection() {
    return (
        <Section className="faq" title="Frequently Asked Questions">
            <div class="grid-2-cols">
                <FaqItem question="Is there a mobile application?">Currently there is no official mobile application. However, if you have a server instance you can access it using a web browser and even install it as a PWA. For Android, there is an unofficial application called TriliumDroid that even works offline (same as a desktop client).</FaqItem>
                <FaqItem question="Where is the data stored?">All your notes will be stored in an SQLite database in an application folder. The reasoning why Trilium uses a database instead of plain text files is both performance and some features would be much more difficult to implement such as clones (same note in multiple places in the tree). To find the application folder, simply go to the About window.</FaqItem>
                <FaqItem question="Do I need a server to use Trilium?">No, the server allows access via a web browser and manages the synchronization if you have multiple devices. To get started, it's enough to download the desktop application and start using it.</FaqItem>
                <FaqItem question="How well does the application scale with a large amount of notes?">Depending on usage, the application should be able to handle at least 100.000 notes without an issue. Do note that the sync process can sometimes fail if uploading many large files (&gt; 1 GB per file) since Trilium is meant more as a knowledge base application rather than a file store (like NextCloud, for example).</FaqItem>
                <FaqItem question="Can I share my database over a network drive?">No, it's generally not a good idea to share a SQLite database over a network drive. Although sometimes it might work, there are chances that the database will get corrupted due to imperfect file locks over a network.</FaqItem>
                <FaqItem question="How is my data protected?">By default, notes are not encrypted and can be read directly from the database. Once a note is marked as encrypted, the note is encrypted using AES-128-CBC.</FaqItem>
            </div>
        </Section>
    );
}

function FaqItem({ question, children }: { question: string; children: ComponentChildren }) {
    return (
        <Card title={question}>
            {children}
        </Card>
    )
}

function FinalCta() {
    return (
        <Section className="final-cta accented" title="Ready to get started with Trilium Notes?">
            <p>Build your personal knowledge base with powerful features and full privacy.</p>

            <div class="buttons">
                <Button href="./get-started/" text="Get started" />
            </div>
        </Section>
    )
}
