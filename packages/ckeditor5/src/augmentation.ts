import "ckeditor5";

declare global {
    var glob: {
        getComponentByEl(el: unknown): {
            triggerCommand(command: string): void;
        };
        getActiveContextNote(): {
            noteId: string;
        };
        getHeaders(): Promise<Record<string, string>>;
    }
}

declare module "ckeditor5" {
    interface Editor {
        getSelectedHtml(): string;
        removeSelection(): Promise<void>;
    }
}
