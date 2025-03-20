import type FNote from "./entities/fnote";
import type { Froca } from "./services/froca-interface";
import { Suggestion } from "./services/note_autocomplete.ts";
import utils from "./services/utils.ts";
import appContext from "./components/app_context.ts";
import server from "./services/server.ts";
import library_loader, { Library } from "./services/library_loader.ts";
import type { init } from "i18next";
import type { lint } from "./services/eslint.ts";

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
    getActiveContextNote: FNote;
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

    type AutoCompleteCallback = (values: AutoCompleteCallbackArg[]) => void;

    interface AutoCompleteArg {
        displayKey: "name" | "value" | "notePathTitle";
        cache?: boolean;
        source: (term: string, cb: AutoCompleteCallback) => void,
        templates?: {
            suggestion: (suggestion: Suggestion) => string | undefined
        }
    };

    interface JQuery {
        autocomplete: (action?: "close" | "open" | "destroy" | "val" | AutoCompleteConfig, args?: AutoCompleteArg[] | string) => JQuery<?>;

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
    var WZoom = {
        create(selector: string, opts: {
            maxScale: number;
            speed: number;
            zoomOnClick: boolean
        })
    };
    interface MermaidApi {
        initialize(opts: {
            startOnLoad: boolean,
            theme: string,
            securityLevel: "antiscript"
        }): void;
        render(selector: string, data: string);
    }
    interface MermaidLoader {

    }
    interface MermaidChartConfig {
        useMaxWidth: boolean;
    }
    interface MermaidConfig {
        theme: string;
        securityLevel: "antiscript",
        flow: MermaidChartConfig;
        sequence: MermaidChartConfig;
        gantt: MermaidChartConfig;
        class: MermaidChartConfig;
        state: MermaidChartConfig;
        pie: MermaidChartConfig;
        journey: MermaidChartConfig;
        git: MermaidChartConfig;
    }
    var mermaid: {
        mermaidAPI: MermaidApi;
        registerLayoutLoaders(loader: MermaidLoader);
        init(config: MermaidConfig, el: HTMLElement | JQuery<HTMLElement>);
        parse(content: string, opts: {
            suppressErrors: true
        }): Promise<{
            config: {
                layout: string;
            }
        }>
    };

    var CKEditor: {
        BalloonEditor: {
            create(el: HTMLElement, config: {
                removePlugins?: string[];
                toolbar: {
                    items: any[];
                },
                placeholder: string;
                mention: MentionConfig
            })
        }
    };

    var CodeMirror: {
        (el: HTMLElement, opts: {
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
        }): CodeMirrorInstance;
        keyMap: {
            default: Record<string, string>;
        };
        modeURL: string;
        modeInfo: ModeInfo[];
        findModeByMIME(mime: string): ModeInfo;
        autoLoadMode(instance: CodeMirrorInstance, mode: string)
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

    type TextEditorElement = {};
    interface Writer {
        setAttribute(name: string, value: string, el: TextEditorElement);
        createPositionAt(el: TextEditorElement, opt?: "end");
        setSelection(pos: number, pos?: number);
    }
    interface TextNode {
        previousSibling?: TextNode;
        name: string;
        data: string;
        startOffset: number;
        _attrs: {
            get(key: string): {
                length: number
            }
        }
    }
    interface TextPosition {
        textNode: TextNode;
        offset: number;
        compareWith(pos: TextPosition): string;
    }
    interface TextEditor {
        model: {
            document: {
                on(event: string, cb: () => void);
                getRoot(): TextEditorElement;
                selection: {
                    getFirstPosition(): undefined | TextPosition;
                    getLastPosition(): undefined | TextPosition;
                }
            },
            insertContent(modelFragment: any, selection: any);
            change(cb: (writer: Writer) => void)
        },
        editing: {
            view: {
                document: {
                    on(event: string, cb: (event: {
                        stop();
                    }, data: {
                        preventDefault();
                    }) => void, opts?: {
                        priority: "high"
                    });
                    getRoot(): TextEditorElement
                },
                domRoots: {
                    values: () => {
                        next: () => {
                            value: string;
                        }
                    };
                }
                change(cb: (writer: Writer) => void);
                scrollToTheSelection(): void;
            }
        },
        plugins: {
            get(command: string)
        },
        data: {
            processor: {
                toView(html: string);
            };
            toModel(viewFeragment: any);
        },
        getData(): string;
        setData(data: string): void;
        getSelectedHtml(): string;
        removeSelection(): void;
        execute<T>(action: string, ...args: unknown[]): T;
        focus(): void;
        sourceElement: HTMLElement;
    }

    interface EditingState {
        highlightedResult: string;
        results: unknown[];
    }

    interface CKFindResult {
        results: {
            get(number): {
                marker: {
                    getStart(): TextPosition;
                    getRange(): number;
                };
            }
        } & [];
    }

    interface MentionItem {
        action?: string;
        noteTitle?: string;
        id: string;
        name: string;
        link?: string;
        notePath?: string;
        highlightedNotePathTitle?: string;
    }

    interface MentionConfig {
        feeds: {
            marker: string;
            feed: (queryText: string) => MentionItem[] | Promise<MentionItem[]>;
            itemRenderer?: (item: {
                highlightedNotePathTitle: string
            }) => void;
            minimumCharacters: number;
        }[];
    }
}
