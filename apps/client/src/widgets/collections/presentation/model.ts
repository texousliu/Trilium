import FNote from "../../../entities/fnote";
import contentRenderer from "../../../services/content_renderer";

type DangerouslySetInnerHTML = { __html: string; };

/** A top-level slide with optional vertical slides. */
export interface PresentationSlideModel extends PresentationSlideBaseModel {
    verticalSlides: PresentationSlideBaseModel[] | undefined;
}

/** Either a top-level slide or a vertical slide. */
interface PresentationSlideBaseModel {
    noteId: string;
    content: DangerouslySetInnerHTML;
}

export interface PresentationModel {
    slides: PresentationSlideModel[];
}

export async function buildPresentationModel(note: FNote): Promise<PresentationModel> {

    const slideNotes = await note.getChildNotes();
    const slides: PresentationSlideModel[] = [];

    for (const slideNote of slideNotes) {
        slides.push({
            noteId: slideNote.noteId,
            content: await processContent(slideNote),
            verticalSlides: await buildVerticalSlides(slideNote)
        })
    }

    return { slides };
}

async function buildVerticalSlides(parentSlideNote: FNote): Promise<undefined | PresentationSlideBaseModel[]> {
    const children = await parentSlideNote.getChildNotes();
    if (!children.length) return;

    const slides: PresentationSlideBaseModel[] = [];
    for (const childNote of children) {
        slides.push({
            noteId: childNote.noteId,
            content: await processContent(childNote)
        });
    }
    return slides;
}

async function processContent(note: FNote): Promise<DangerouslySetInnerHTML> {
    const { $renderedContent } = await contentRenderer.getRenderedContent(note, {

    });
    return { __html: $renderedContent.html() };
}
