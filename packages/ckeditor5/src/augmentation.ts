import "ckeditor5";

declare global {
    interface Component {
        triggerCommand(command: string): void;
    }

    interface EditorComponent extends Component {
        loadReferenceLinkTitle($el: JQuery<HTMLElement>, href: string): Promise<void>;
        createNoteForReferenceLink(title: string): Promise<string>;
        loadIncludedNote(noteId: string, $el: JQuery<HTMLElement>): void;
    }

    var glob: {
        getComponentByEl<T extends Component>(el: unknown): T;
        getActiveContextNote(): {
            noteId: string;
        };
        getHeaders(): Promise<Record<string, string>>;
        getReferenceLinkTitle(href: string): Promise<string>;
        getReferenceLinkTitleSync(href: string): string;
        importMarkdownInline(): void;
    }
}

declare module "ckeditor5" {
    interface Editor {
        getSelectedHtml(): string;
        removeSelection(): Promise<void>;
    }
}
