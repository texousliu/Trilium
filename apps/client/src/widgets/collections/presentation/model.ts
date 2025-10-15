import FNote from "../../../entities/fnote";

type DangerouslySetInnerHTML = { __html: string; };

export interface PresentationSlideModel {
    content: DangerouslySetInnerHTML;
    verticalSlides: PresentationVerticalSlideModel[] | undefined;
}

interface PresentationVerticalSlideModel {
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
            content: processContent(await slideNote.getContent() ?? ""),
            verticalSlides: await buildVerticalSlides(slideNote)
        })
    }

    return { slides };
}

async function buildVerticalSlides(parentSlideNote: FNote): Promise<undefined | PresentationVerticalSlideModel[]> {
    const children = await parentSlideNote.getChildNotes();
    if (!children.length) return;

    const slides: PresentationVerticalSlideModel[] = [];
    for (const child of children) {
        slides.push({
            content: processContent(await child.getContent())
        });
    }
    return slides;
}

function processContent(content: string | undefined): DangerouslySetInnerHTML {
    return { __html: content ?? "" };
}
