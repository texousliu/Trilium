import { useEffect, useLayoutEffect, useState } from "preact/hooks";
import { RawHtmlBlock } from "../../react/RawHtml";
import froca from "../../../services/froca";
import type FNote from "../../../entities/fnote";
import content_renderer from "../../../services/content_renderer";
import type { ViewModeProps } from "../interface";
import { useFilteredNoteIds } from "./utils";

interface NotesWithContent {
    note: FNote;
    content: string;
}

export function ListPrintView({ note, noteIds: unfilteredNoteIds, onReady }: ViewModeProps<{}>) {
    const noteIds = useFilteredNoteIds(note, unfilteredNoteIds);
    const [ notesWithContent, setNotesWithContent ] = useState<NotesWithContent[]>();

    useLayoutEffect(() => {
        froca.getNotes(noteIds).then(async (notes) => {
            const notesWithContent: NotesWithContent[] = [];

            async function processNote(note: FNote, depth: number) {
                const content = await content_renderer.getRenderedContent(note, {
                    trim: false,
                    noChildrenList: true
                });

                const contentEl = content.$renderedContent[0];

                // Create page title element
                const pageTitleEl = document.createElement("h1");
                pageTitleEl.textContent = note.title;
                contentEl.prepend(pageTitleEl);

                // Rewrite heading tags to ensure proper hierarchy in print view.
                const headings = contentEl.querySelectorAll("h1, h2, h3, h4, h5, h6")
                for (const headingEl of headings) {
                    const currentLevel = parseInt(headingEl.tagName.substring(1), 10);
                    const newLevel = Math.min(currentLevel + depth, 6);
                    const newHeadingEl = document.createElement(`h${newLevel}`);
                    newHeadingEl.innerHTML = headingEl.innerHTML;
                    headingEl.replaceWith(newHeadingEl);
                }

                notesWithContent.push({ note, content: contentEl.innerHTML });

                if (note.hasChildren()) {
                    const imageLinks = note.getRelations("imageLink");
                    const childNotes = await note.getChildNotes();
                    const filteredChildNotes = childNotes.filter((childNote) => !imageLinks.find((rel) => rel.value === childNote.noteId));
                    for (const childNote of filteredChildNotes) {
                        await processNote(childNote, depth + 1);
                    }
                }
            }

            for (const note of notes) {
                await processNote(note, 1);
            }
            setNotesWithContent(notesWithContent);
        });
    }, [noteIds]);

    useEffect(() => {
        if (notesWithContent && onReady) {
            onReady();
        }
    }, [ notesWithContent, onReady ]);

    return (
        <div class="note-list list-print-view">
            <div class="note-list-container use-tn-links">
                <h1>{note.title}</h1>

                {notesWithContent?.map(({ note: childNote, content }) => (
                    <section id={`note-${childNote.noteId}`} class="note">
                        <RawHtmlBlock html={content} />
                    </section>
                ))}
            </div>
        </div>
    );
}
