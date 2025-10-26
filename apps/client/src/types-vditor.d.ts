declare module "vditor" {
    export interface IVditor {
        getValue(): string;
        setValue(value: string): void;
        focus(): void;
        blur(): void;
        destroy(): void;
        getHTML(): string;
        getCursorPosition(): {
            start: number;
            end: number;
        };
        insertValue(value: string): void;
        disabled(): void;
        enable(): void;
    }

    export interface VditorOptions {
        height?: string | number;
        width?: string | number;
        mode?: "wysiwyg" | "ir" | "sv";
        theme?: "classic" | "dark";
        icon?: "ant" | "material";
        toolbar?: Array<string | object>;
        counter?: {
            enable: boolean;
            type?: "markdown" | "text";
        };
        cache?: {
            enable: boolean;
            id?: string;
        };
        preview?: {
            delay?: number;
            maxWidth?: number;
            mode?: "both" | "editor";
            url?: string;
            parse?: (element: HTMLElement) => void;
            transform?: (html: string) => string;
            theme?: {
                current: string;
                path?: string;
            };
        };
        input?: (value: string) => void;
        focus?: (value: string) => void;
        blur?: (value: string) => void;
        esc?: (value: string) => void;
        ctrlEnter?: (value: string) => void;
        select?: (value: string) => void;
        upload?: {
            accept?: string;
            multiple?: boolean;
            url?: string;
            linkToImgUrl?: string;
            filename?: (name: string) => string;
            handler?: (files: File[]) => Promise<string>;
            validate?: (files: File[]) => string | boolean;
            success?: (editor: HTMLPreElement, msg: string) => void;
            error?: (msg: string) => void;
            token?: string;
            withCredentials?: boolean;
            headers?: Record<string, string>;
            fieldName?: string;
        };
        resize?: {
            enable?: boolean;
            position?: "top" | "bottom";
        };
        lang?: string;
        placeholder?: string;
        hint?: {
            delay?: number;
            emoji?: Record<string, string>;
            emojiPath?: string;
        };
        cdn?: string;
        value?: string;
        after?: () => void;
        customWysiwygToolbar?: () => void;
    }

    export default class Vditor {
        constructor(element: HTMLElement, options?: VditorOptions);
        getValue(): string;
        setValue(value: string): void;
        focus(): void;
        blur(): void;
        destroy(): void;
        getHTML(): string;
        getCursorPosition(): { start: number; end: number };
        insertValue(value: string): void;
        disabled(): void;
        enable(): void;
    }
}

declare module "vditor/dist/index.css" {
    const content: any;
    export default content;
}
