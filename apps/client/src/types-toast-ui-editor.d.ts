declare module "@toast-ui/editor" {
    export interface EditorOptions {
        el: HTMLElement;
        height?: string;
        initialEditType?: "markdown" | "wysiwyg";
        previewStyle?: "tab" | "vertical";
        initialValue?: string;
        theme?: "light" | "dark";
        usageStatistics?: boolean;
        toolbarItems?: Array<string | Array<string>>;
        hideModeSwitch?: boolean;
        events?: {
            change?: () => void;
            focus?: () => void;
            blur?: () => void;
        };
        hooks?: {
            addImageBlobHook?: (blob: Blob, callback: (url: string, altText?: string) => void) => void;
        };
    }

    export default class Editor {
        constructor(options: EditorOptions);

        getMarkdown(): string;
        setMarkdown(markdown: string, cursorToEnd?: boolean): void;
        getHTML(): string;
        setHTML(html: string, cursorToEnd?: boolean): void;

        focus(): void;
        blur(): void;

        show(): void;
        hide(): void;

        destroy(): void;

        changeMode(mode: "markdown" | "wysiwyg", isWithoutFocus?: boolean): void;
        getCurrentModeEditor(): any;

        isMarkdownMode(): boolean;
        isWysiwygMode(): boolean;

        setHeight(height: string): void;

        on(eventType: string, handler: Function): void;
        off(eventType: string): void;

        exec(command: string, ...args: any[]): void;

        getSelectedText(): string;
        replaceSelection(text: string): void;

        scrollTop(value?: number): number;

        moveCursorToEnd(): void;
        moveCursorToStart(): void;
    }

    export interface ViewerOptions {
        el: HTMLElement;
        initialValue?: string;
        theme?: "light" | "dark";
    }

    export class Viewer {
        constructor(options: ViewerOptions);
        setMarkdown(markdown: string): void;
        destroy(): void;
    }
}

declare module "@toast-ui/editor/dist/toastui-editor.css" {
    const css: string;
    export default css;
}

declare module "@toast-ui/editor/dist/theme/toastui-editor-dark.css" {
    const css: string;
    export default css;
}
