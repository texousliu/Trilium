import { useEffect, useRef, useState } from "preact/hooks";
import type FNote from "../../entities/fnote.js";
import { TypeWidgetProps } from "./type_widget.js";
import { useEditorSpacedUpdate } from "../react/hooks.js";
import utils from "../../services/utils.js";
import server from "../../services/server.js";

interface MarkdownEditorState {
    content: string;
    isEditorReady: boolean;
    isFallbackMode: boolean;
    isLoading: boolean;
}

export default function Markdown({ note, viewScope, ntxId, parentComponent, noteContext }: TypeWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const fallbackTextareaRef = useRef<HTMLTextAreaElement>(null);
    const editorRef = useRef<any>(null);
    const [editorState, setEditorState] = useState<MarkdownEditorState>({
        content: "",
        isEditorReady: false,
        isFallbackMode: false,
        isLoading: true
    });

    const spacedUpdate = useEditorSpacedUpdate({
        note,
        noteContext,
        noteType: "markdown",
        getData() {
            return {
                content: editorState.content || ""
            };
        },
        onContentChange(newContent) {
            setEditorState(prev => ({ ...prev, content: newContent }));
        }
    });

    // Extract headings from markdown content
    const extractHeadings = (markdown: string) => {
        const headings: Array<{ id: string; level: number; text: string }> = [];
        const lines = markdown.split('\n');
        const headingRegex = /^(#{1,6})\s+(.*)$/;

        lines.forEach((line, index) => {
            const match = line.match(headingRegex);
            if (match) {
                const level = match[1].length;
                const text = match[2].trim();
                const id = `heading-${index}-${Date.now()}`;
                headings.push({ id, level, text });
            }
        });

        return headings;
    };

    // Update TOC in context
    const updateTableOfContents = (content: string) => {
        const headings = extractHeadings(content);

        if (noteContext) {
            noteContext.setContextData("toc", {
                headings,
                scrollToHeading: (heading: { id: string; level: number; text: string }) => {
                    // Find the heading in the editor content and scroll to it
                    const content = editorRef.current?.getMarkdown() || "";
                    const lines = content.split('\n');
                    let lineIndex = 0;
                    let headingFound = false;

                    for (let i = 0; i < lines.length; i++) {
                        const match = lines[i].match(/^(#{1,6})\s+(.*)$/);
                        if (match && match[2].trim() === heading.text) {
                            lineIndex = i;
                            headingFound = true;
                            break;
                        }
                    }

                    if (headingFound && editorRef.current) {
                        // Scroll to the line in the editor
                        const editorElement = editorRef.current.el;
                        const editorContent = editorElement.querySelector('.toastui-editor-contents');
                        if (editorContent) {
                            // Toast UI Editor uses CodeMirror internally, so we need to scroll to the line
                            const codeMirror = editorRef.current.editor.codeMirror;
                            if (codeMirror) {
                                codeMirror.scrollIntoView({ line: lineIndex, ch: 0 });
                            }
                        }
                    }
                }
            });
        }
    };

    useEffect(() => {
        const initializeEditor = async () => {
            setEditorState(prev => ({ ...prev, isLoading: true }));

            try {
                const blob = await note.getBlob();
                const markdownContent = blob?.content || "";
                setEditorState(prev => ({ ...prev, content: markdownContent }));

                // Update TOC initially
                updateTableOfContents(markdownContent);

                // Try to load Toast UI Editor
                try {
                    const { default: Editor } = await import("@toast-ui/editor");
                    await import("@toast-ui/editor/dist/toastui-editor.css");

                    // Load dark theme if needed
                    if (isDarkTheme()) {
                        await import("@toast-ui/editor/dist/theme/toastui-editor-dark.css");
                    }

                    if (!containerRef.current) return;

                    // Initialize editor
                    const editor = new Editor({
                        el: containerRef.current,
                        height: "100%",
                        initialEditType: "markdown",
                        previewStyle: "vertical",
                        theme: isDarkTheme() ? "dark" : "light",
                        usageStatistics: false,
                        hideModeSwitch: false,
                        initialValue: markdownContent,
                        toolbarItems: [
                            ["heading", "bold", "italic", "strike"],
                            ["hr", "quote"],
                            ["ul", "ol", "task", "indent", "outdent"],
                            ["table", "image", "link"],
                            ["code", "codeblock"],
                            ["scrollSync"]
                        ],
                        hooks: {
                            addImageBlobHook: (blob: Blob, callback: (url: string, altText?: string) => void) => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const dataUrl = e.target?.result as string;
                                    callback(dataUrl, "image");
                                };
                                reader.readAsDataURL(blob);
                            }
                        }
                    });

                    // Store editor reference
                    editorRef.current = editor;

                    // Set up change listener
                    editor.on('change', () => {
                        const newContent = editor.getMarkdown();
                        setEditorState(prev => ({ ...prev, content: newContent }));
                        spacedUpdate.scheduleUpdate();

                        // Update TOC on content change
                        updateTableOfContents(newContent);
                    });

                    setEditorState(prev => ({ ...prev, isEditorReady: true, isFallbackMode: false, isLoading: false }));

                    // Cleanup function
                    return () => {
                        try {
                            editor.destroy();
                            // Clear TOC when editor is destroyed
                            if (noteContext) {
                                noteContext.setContextData("toc", { headings: [], scrollToHeading: () => {} });
                            }
                        } catch (e) {
                            console.warn("Error destroying Toast UI Editor:", e);
                        }
                    };
                } catch (error) {
                    console.error("Failed to initialize Toast UI Editor, falling back to simple editor:", error);
                    // Fallback to textarea
                    setEditorState(prev => ({ ...prev, isFallbackMode: true, isLoading: false }));

                    return () => {
                        // Cleanup fallback editor
                        if (fallbackTextareaRef.current) {
                            fallbackTextareaRef.current.removeEventListener('input', handleFallbackInput);
                        }
                    };
                }
            } catch (error) {
                console.error("Error initializing Markdown editor:", error);
                setEditorState(prev => ({ ...prev, isLoading: false, isFallbackMode: true }));
            }
        };

        initializeEditor();
    }, [note, noteContext, spacedUpdate]);

    // Update TOC for fallback mode when content changes
    useEffect(() => {
        if (editorState.isFallbackMode) {
            updateTableOfContents(editorState.content);
        }
    }, [editorState.isFallbackMode, editorState.content, noteContext]);

    const handleFallbackInput = (e: Event) => {
        const target = e.target as HTMLTextAreaElement;
        setEditorState(prev => ({ ...prev, content: target.value }));
        spacedUpdate.scheduleUpdate();
    };

    const handleFallbackKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const value = target.value;
            const tabChar = '    ';

            target.value = value.substring(0, start) + tabChar + value.substring(end);
            target.selectionStart = target.selectionEnd = start + tabChar.length;

            setEditorState(prev => ({ ...prev, content: target.value }));
            spacedUpdate.scheduleUpdate();
        }
    };

    const isDarkTheme = (): boolean => {
        const body = document.body;
        return body.classList.contains("theme-dark") ||
               body.classList.contains("dark") ||
               body.classList.contains("theme-next-dark") ||
               body.getAttribute('data-theme') === 'dark' ||
               getComputedStyle(body).getPropertyValue('--theme-style')?.trim() === 'dark';
    };

    const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    return (
        <div className="note-detail-markdown note-detail-printable" style={{ height: "100%" }}>
            {editorState.isLoading && (
                <div className="loading-overlay">
                    <div className="loading-markdown-editor">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">Initializing Markdown Editor...</div>
                    </div>
                </div>
            )}

            {editorState.isFallbackMode ? (
                <div className="fallback-markdown-editor-container">
                    <div className="fallback-markdown-editor-header">
                        <div className="fallback-markdown-editor-title">
                            <span className="bx bx-markdown"></span>
                            <span>Markdown Editor</span>
                            <span className="fallback-mode-badge">(Fallback Mode)</span>
                        </div>
                    </div>
                    <textarea
                        ref={fallbackTextareaRef}
                        className="fallback-markdown-editor"
                        value={editorState.content}
                        onChange={handleFallbackInput}
                        onKeyDown={handleFallbackKeyDown}
                        placeholder="Enter Markdown content..."
                    />
                </div>
            ) : (
                <div ref={containerRef} className="toast-ui-editor-container" style={{ height: "100%" }}></div>
            )}
            <style>{`
                .note-detail-markdown {
                    font-family: var(--detail-font-family);
                    background-color: var(--main-background-color);
                    position: relative;
                    overflow: hidden;
                }

                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: var(--main-background-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }

                .loading-markdown-editor {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--muted-text-color);
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--main-border-color);
                    border-top: 3px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 15px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .toast-ui-editor-container {
                    height: 100%;
                    min-height: 300px;
                }

                .toastui-editor {
                    border: none !important;
                    height: 100% !important;
                }

                .toastui-editor-defaultUI {
                    border: none !important;
                    height: 100% !important;
                }

                .toastui-editor-toolbar {
                    border-bottom: 1px solid var(--main-border-color) !important;
                    background-color: var(--accented-background-color) !important;
                }

                .toastui-editor-md-container,
                .toastui-editor-ww-container,
                .toastui-editor-md-preview {
                    background-color: var(--main-background-color) !important;
                }

                .CodeMirror {
                    background-color: var(--main-background-color) !important;
                    color: var(--main-text-color) !important;
                }

                /* Fallback editor styles */
                .fallback-markdown-editor-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .fallback-markdown-editor-header {
                    padding: 8px 12px;
                    background-color: var(--accented-background-color);
                    border-bottom: 1px solid var(--main-border-color);
                }

                .fallback-markdown-editor-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: var(--main-text-color);
                }

                .fallback-mode-badge {
                    font-size: 12px;
                    color: var(--muted-text-color);
                }

                .fallback-markdown-editor {
                    flex: 1;
                    padding: 16px;
                    border: none;
                    outline: none;
                    background-color: var(--main-background-color);
                    color: var(--main-text-color);
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: none;
                    tab-size: 4;
                }
            `}</style>
        </div>
    );
}