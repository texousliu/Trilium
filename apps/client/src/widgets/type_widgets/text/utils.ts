import content_renderer from "../../../services/content_renderer";
import froca from "../../../services/froca";
import link from "../../../services/link";

export async function loadIncludedNote(noteId: string, $el: JQuery<HTMLElement>) {
    const note = await froca.getNote(noteId);
    if (!note) return;

    const $wrapper = $('<div class="include-note-wrapper">');
    const $link = await link.createLink(note.noteId, {
        showTooltip: false
    });

    $wrapper.empty().append($('<h4 class="include-note-title">').append($link));

    const { $renderedContent, type } = await content_renderer.getRenderedContent(note);
    $wrapper.append($(`<div class="include-note-content type-${type}">`).append($renderedContent));

    $el.empty().append($wrapper);
}

export function refreshIncludedNote(container: HTMLDivElement, noteId: string) {
    const includedNotes = container.querySelectorAll(`section[data-note-id="${noteId}"]`);
    for (const includedNote of includedNotes) {
        loadIncludedNote(noteId, $(includedNote as HTMLElement));
    }
}
