import { ComponentChildren } from 'preact';
import Card from '../../components/Card';
import Section from '../../components/Section';
import DownloadButton from '../../components/DownloadButton';
import "./index.css";
import { usePageTitle } from '../../hooks';
import Button from '../../components/Button';
import gitHubIcon from "../../assets/boxicons/bx-github.svg?raw";
import dockerIcon from "../../assets/boxicons/bx-docker.svg?raw";

export function Home() {
    usePageTitle("");

	return (
        <>
            <HeroSection />
            <BenefitsSection />
            <NoteTypesSection />
            <CollectionsSection />
            <FaqSection />
        </>
	);
}

function HeroSection() {
    return (
        <Section className="hero-section">
            <div class="title-section">
                <h1>Organize your thoughts. Build your personal knowledge base.</h1>
                <p>Trilium is an open-source solution for note-taking and organizing a personal knowledge base. Use it locally on your desktop, or sync it with your self-hosted server to keep your notes everywhere you go.</p>

                <div className="download-wrapper">
                    <DownloadButton big />
                    <a class="more-download-options desktop-only" href="./download">See all download options</a>
                    <Button href="./download" className="mobile-only" text="See download options" />
                    <div className="additional-options">
                        <Button iconSvg={gitHubIcon} outline text="GitHub" href="https://github.com/TriliumNext/Trilium/" openExternally />
                        <Button iconSvg={dockerIcon} outline text="Docker Hub" href="https://hub.docker.com/r/triliumnext/trilium" openExternally />
                    </div>
                </div>

            </div>

            <img class="screenshot" src="./src/assets/screenshot_desktop_win.png" />
        </Section>
    )
}

function BenefitsSection() {
    return (
         <Section className="benefits" title="Benefits">
            <div className="benefits-container grid-3-cols">
                <Card title="Note structure">Notes can be arranged hierarchically. There's no need for folders, since each note can contain sub-notes. A single note can be added in multiple places in the hierarchy.</Card>
                <Card title="Labels and relationships between notes">Define <em> relations </em> between notes
                    or add <em> labels </em> for easy categorization. Using promoted attributes, there's an easy way to
                    enter structured information about the notes which can later be displayed in other formats such as a
                    table.</Card>
                <Card title="Note revisions">Notes are periodically saved in the background and revisions can be used to check the old content of a note or delete accidental changes. Revisions can also be created on-demand.</Card>
                <Card title="Quick search and commands">Jump quickly to notes across the hierarchy by searching for their title, with
                    fuzzy matching to account for typos or slight differences. Or search through all the various
                    commands of the application.</Card>
                <Card title="Powerful search">Or search for text inside notes and narrow down the search by filtering by the parent note, or by depth.</Card>
                <Card title="Protected notes">Protect sensitive personal information by encrypting the notes and locking them behind a password-protected session.</Card>
                <Card title="Import/export">Easily import Markdown and ENEX formats from other note-taking applications, or export to Markdown or HTML.</Card>
                <Card title="Workspaces and hoisting">Easily separate your personal and work notes by grouping them under a workspace, which focuses your note tree to only show a specific set of notes.</Card>
                <Card title="Web clipper">Grab web pages (or screenshots) and place them directly into Trilium using the web clipper browser extension.</Card>
                <Card title="Synchronization">Use a self-hosted or cloud instance to easily synchronize your notes across multiple devices, and to access it from your mobile phone using a PWA (progressive web application).</Card>
                <Card title="Share notes on the web">If you have a server instance, you can easily use it to share a subset of your notes with other people.</Card>
                <Card title="Advanced scripting and REST API">Create your own integrations within Trilium by writing custom widgets, or custom-server side logic. Interact externally with the Trilium database by using the built-in REST API.</Card>
            </div>
        </Section>
    );
}

function NoteTypesSection() {
    return (
        <Section className="note-types" title="Note types">
            <div class="note-types-container grid-3-cols">
                <Card title="Text notes" imageUrl="./src/assets/type_text.png">The notes are edited using a visual (WYSIWYG) editor, with support for tables, images, math expressions, code blocks with syntax highlighting. Quickly format the text using Markdown-like syntax or using slash commands.</Card>
                <Card title="Code notes" imageUrl="./src/assets/type_code.png">Large samples of source code or scripts use a dedicated editor, with syntax highlighting for many programming languages and with various color themes.</Card>
                <Card title="File notes" imageUrl="./src/assets/type_file.png">Embed multimedia files such as PDFs, images, videos with an in-application preview.</Card>
                <Card title="Canvas" imageUrl="./src/assets/type_canvas.png">Arrange shapes, images and text across an infinite canvas, using the same technology behind <a href="https://excalidraw.com">excalidraw.com</a>. Ideal for diagrams, sketches and visual planning.</Card>
                <Card title="Mermaid diagrams" imageUrl="./src/assets/type_mermaid.png">Create diagrams such as flowcharts, class &amp; sequence diagrams, Gantt charts and many more, using the Mermaid syntax.</Card>
                <Card title="Mindmap" imageUrl="./src/assets/type_mindmap.png">Organize your thoughts visually or do a brainstorming session by using <a href="https://en.wikipedia.org/wiki/Mind_map">mind map diagrams</a>.</Card>
            </div>
            <p>and others: note map, relation map, saved searches, render note, web views.</p>
        </Section>
    );
}

function CollectionsSection() {
    return (
        <Section className="collections" title="Collections">
            <div className="collections-container grid-2-cols">
                <Card title="Calendar" imageUrl="./src/assets/collection_calendar.png">Organize your personal or professional events using a calendar, with support for all-day and multi-day events. See your events at a glance with the week, month and year views. Easy interaction to add or drag events.</Card>
                <Card title="Table" imageUrl="./src/assets/collection_table.png">Display and edit information about notes in a tabular structure, with various column types such as text, number, check boxes, date &amp; time, links and colors and support for relations. Optionally, display the notes within a tree hierarchy inside the table.</Card>
                <Card title="Board" imageUrl="./src/assets/collection_board.png">Organize your tasks or project status into a Kanban board with an easy way to create new items and columns and simply changing their status by dragging across the board.</Card>
                <Card title="Geomap" imageUrl="./src/assets/collection_geomap.png">Plan your vacations or mark your points of interest directly on a geographical map using customizable markers. Display recorded GPX tracks to track itineraries.</Card>
            </div>
        </Section>
    );
}

function FaqSection() {
    return (
        <Section className="faq" title="Frequently Asked Questions">
            <FaqItem question="Is there a mobile application?">Currently there is no official mobile application. However, if you have a server instance you can access it using a web browser and even install it as a PWA. For Android, there is an unofficial application called TriliumDroid that even works offline (same as a desktop client).</FaqItem>
            <FaqItem question="Where is the data stored?">All your notes will be stored in an SQLite database in an application folder. The reasoning why Trilium uses a database instead of plain text files is both performance and some features would be much more difficult to implement such as clones (same note in multiple places in the tree). To find the application folder, simply go to the About window.</FaqItem>
            <FaqItem question="Do I need a server to use Trilium?">No, the server allows access via a web browser and manages the synchronization if you have multiple devices. To get started, it's enough to download the desktop application and start using it.</FaqItem>
            <FaqItem question="How well does the application scale with a large amount of notes?">Depending on usage, the application should be able to handle at least 100.000 notes without an issue. Do note that the sync process can sometimes fail if uploading many large files (&gt; 1 GB per file) since Trilium is meant more as a knowledge base application rather than a file store (like NextCloud, for example).</FaqItem>
            <FaqItem question="Can I share my database over a network drive?">No, it's generally not a good idea to share a SQLite database over a network drive. Although sometimes it might work, there are chances that the database will get corrupted due to imperfect file locks over a network.</FaqItem>
            <FaqItem question="How is my data protected?">By default, notes are not encrypted and can be read directly from the database. Once a note is marked as encrypted, the note is encrypted using AES-128-CBC.</FaqItem>
        </Section>
    );
}

function FaqItem({ question, children }: { question: string; children: ComponentChildren }) {
    return (
        <details>
            <summary>{question}</summary>
            <p>{children}</p>
        </details>
    )
}
