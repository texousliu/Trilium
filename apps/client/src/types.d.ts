import type FNote from "./entities/fnote";
import type { Froca } from "./services/froca-interface";
import { Suggestion } from "./services/note_autocomplete";
import utils from "./services/utils";
import appContext, { AppContext } from "./components/app_context";
import server from "./services/server";
import library_loader, { Library } from "./services/library_loader";
import type { lint } from "./services/eslint";
import type { Mermaid, MermaidConfig } from "mermaid";

interface ElectronProcess {
    type: string;
    platform: string;
}

interface CustomGlobals {
    isDesktop: typeof utils.isDesktop;
    isMobile: typeof utils.isMobile;
    device: "mobile" | "desktop";
    getComponentByEl: typeof appContext.getComponentByEl;
    getHeaders: typeof server.getHeaders;
    getReferenceLinkTitle: (href: string) => Promise<string>;
    getReferenceLinkTitleSync: (href: string) => string;
    getActiveContextNote: () => FNote | null;
    requireLibrary: typeof library_loader.requireLibrary;
    ESLINT: Library;
    appContext: AppContext;
    froca: Froca;
    treeCache: Froca;
    importMarkdownInline: () => Promise<unknown>;
    SEARCH_HELP_TEXT: string;
    activeDialog: JQuery<HTMLElement> | null;
    componentId: string;
    csrfToken: string;
    baseApiUrl: string;
    isProtectedSessionAvailable: boolean;
    isDev: boolean;
    isMainWindow: boolean;
    maxEntityChangeIdAtLoad: number;
    maxEntityChangeSyncIdAtLoad: number;
    assetPath: string;
    appPath: string;
    instanceName: string;
    appCssNoteIds: string[];
    triliumVersion: string;
    TRILIUM_SAFE_MODE: boolean;
    platform?: typeof process.platform;
    linter: typeof lint;
    hasNativeTitleBar: boolean;
}

type RequireMethod = (moduleName: string) => any;

declare global {
    interface Window {
        logError(message: string);
        logInfo(message: string);

        process?: ElectronProcess;
        glob?: CustomGlobals;
    }

    interface AutoCompleteConfig {
        appendTo?: HTMLElement | null;
        hint?: boolean;
        openOnFocus?: boolean;
        minLength?: number;
        tabAutocomplete?: boolean;
        autoselect?: boolean;
        dropdownMenuContainer?: HTMLElement;
        debug?: boolean;
    }

    type AutoCompleteCallback = (values: AutoCompleteArg[]) => void;

    interface AutoCompleteArg {
        name?: string;
        value?: string;
        notePathTitle?: string;
        displayKey?: "name" | "value" | "notePathTitle";
        cache?: boolean;
        source?: (term: string, cb: AutoCompleteCallback) => void,
        templates?: {
            suggestion: (suggestion: Suggestion) => string | undefined
        }
    }

    interface JQuery {
        autocomplete: (action?: "close" | "open" | "destroy" | "val" | AutoCompleteConfig, args?: AutoCompleteArg[] | string) => JQuery<HTMLElement>;

        getSelectedNotePath(): string | undefined;
        getSelectedNoteId(): string | null;
        setSelectedNotePath(notePath: string | null | undefined);
        getSelectedExternalLink(): string | undefined;
        setSelectedExternalLink(externalLink: string | null | undefined);
        setNote(noteId: string);
        markRegExp(regex: RegExp, opts: {
            element: string;
            className: string;
            separateWordSearch: boolean;
            caseSensitive: boolean;
            done?: () => void;
        });
        unmark(opts?: {
            done: () => void;
        });
    }

    interface JQueryStatic {
        hotkeys: {
            options: {
                filterInputAcceptingElements: boolean;
                filterContentEditable: boolean;
                filterTextInputs: boolean;
            }
        }
    }

    var logError: (message: string, e?: Error | string) => void;
    var logInfo: (message: string) => void;
    var glob: CustomGlobals;
    //@ts-ignore
    var require: RequireMethod;
    var __non_webpack_require__: RequireMethod | undefined;

    // Libraries
    // TODO: Replace once library loader is replaced with webpack.
    var hljs: {
        highlightAuto(text: string);
        highlight(text: string, {
            language: string
        });
    };
    var renderMathInElement: (element: HTMLElement, options: {
        trust: boolean;
    }) => void;

    interface CodeMirrorOpts {
        value: string;
        viewportMargin: number;
        indentUnit: number;
        matchBrackets: boolean;
        matchTags: { bothTags: boolean };
        highlightSelectionMatches: {
            showToken: boolean;
            annotateScrollbar: boolean;
        };
        lineNumbers: boolean;
        lineWrapping: boolean;
        keyMap?: "vim" | "default";
        lint?: boolean;
        gutters?: string[];
        tabindex?: number;
        dragDrop?: boolean;
        placeholder?: string;
        readOnly?: boolean;
    }

    var CodeMirror: {
        (el: HTMLElement, opts: CodeMirrorOpts): CodeMirrorInstance;
        keyMap: {
            default: Record<string, string>;
        };
        modeURL: string;
        modeInfo: ModeInfo[];
        findModeByMIME(mime: string): ModeInfo;
        autoLoadMode(instance: CodeMirrorInstance, mode: string)
        registerHelper(type: string, filter: string | null, callback: (text: string, options: object) => unknown);
        Pos(line: number, col: number);
    }

    interface ModeInfo {
        name: string;
        mode: string;
        mime: string;
        mimes: string[];
    }

    interface CodeMirrorInstance {
        getValue(): string;
        setValue(val: string);
        clearHistory();
        setOption(name: string, value: string);
        refresh();
        focus();
        getCursor(): { line: number, col: number, ch: number };
        setCursor(line: number, col: number);
        getSelection(): string;
        lineCount(): number;
        on(event: string, callback: () => void);
        operation(callback: () => void);
        scrollIntoView(pos: number);
        doc: {
            getValue(): string;
            markText(
                from: { line: number, ch: number } | number,
                to: { line: number, ch: number } | number,
                opts: {
                    className: string
                });
            setSelection(from: number, to: number);
            replaceRange(text: string, from: number, to: number);
        }
    }

    var katex: {
        renderToString(text: string, opts: {
            throwOnError: boolean
        });
    }

    /*
     * Panzoom
     */

    function panzoom(el: HTMLElement, opts: {
        maxZoom: number,
        minZoom: number,
        smoothScroll: false,
        filterKey: (e: { altKey: boolean }, dx: number, dy: number, dz: number) => void;
    });

    interface PanZoom {
        zoomTo(x: number, y: number, scale: number);
        moveTo(x: number, y: number);
        on(event: string, callback: () => void);
        getTransform(): unknown;
        dispose(): void;
    }
}
