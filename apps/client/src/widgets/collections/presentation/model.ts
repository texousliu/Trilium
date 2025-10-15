import FNote from "../../../entities/fnote";

export interface PresentationSlideModel {
    content: string;
}

export interface PresentationModel {
    slides: PresentationSlideModel[];
}

export async function buildPresentationModel(note: FNote): Promise<PresentationModel> {

    const slideNotes = await note.getChildNotes();
    const slides: PresentationSlideModel[] = [];

    for (const slideNote of slideNotes) {
        slides.push({
            content: await slideNote.getContent() ?? ""
        })
    }

    return {
        slides
    };
}
