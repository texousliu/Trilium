import Card from '../../components/Card';
import Section from '../../components/Section';

export function Home() {
	return (
        <>
            <Section className="benefits" title="Benefits">
                <div className="benefits-container">
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

            <Section className="note-types" title="Note types">
                <div class="note-types-container">
                    <Card title="Text notes" imageUrl="./src/assets/type_text.png">The notes are edited using a visual (WYSIWYG) editor, with support for tables, images, math expressions, code blocks with syntax highlighting. Quickly format the text using Markdown-like syntax or using slash commands.</Card>
                    <Card title="Code notes" imageUrl="./src/assets/type_code.png">Large samples of source code or scripts use a dedicated editor, with syntax highlighting for many programming languages and with various color themes.</Card>
                    <Card title="File notes" imageUrl="./src/assets/type_file.png">Embed multimedia files such as PDFs, images, videos with an in-application preview.</Card>
                    <Card title="Canvas" imageUrl="./src/assets/type_canvas.png">Arrange shapes, images and text across an infinite canvas, using the same technology behind <a href="https://excalidraw.com">excalidraw.com</a>. Ideal for diagrams, sketches and visual planning.</Card>
                    <Card title="Mermaid diagrams" imageUrl="./src/assets/type_mermaid.png">Create diagrams such as flowcharts, class &amp; sequence diagrams, Gantt charts and many more, using the Mermaid syntax.</Card>
                    <Card title="Mindmap" imageUrl="./src/assets/type_mindmap.png">Organize your thoughts visually or do a brainstorming session by using <a href="https://en.wikipedia.org/wiki/Mind_map">mind map diagrams</a>.</Card>
                </div>
                <p>and others: note map, relation map, saved searches, render note, web views.</p>
            </Section>
        </>
	);
}
