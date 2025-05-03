import "ckeditor5";

declare global {
    var glob: {
        getComponentByEl(el: unknown): {
            triggerCommand(command: string): void;
        };
    }
}

declare module "ckeditor5" {
    interface Editor {
        getSelectedHtml(): string;
        removeSelection(): Promise<void>;
    }
}
