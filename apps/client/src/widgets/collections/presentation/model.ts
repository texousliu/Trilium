import FNote from "../../../entities/fnote";

export interface PresentationSlideModel {
    content: { __html: string; };
}

export interface PresentationModel {
    slides: PresentationSlideModel[];
}

export async function buildPresentationModel(note: FNote): Promise<PresentationModel> {

    const slideNotes = await note.getChildNotes();
    const slides: PresentationSlideModel[] = [];

    for (const slideNote of slideNotes) {
        slides.push({
            content: {
                __html: await slideNote.getContent() ?? ""
            }
        })
    }

    return {
        slides
    };
}
