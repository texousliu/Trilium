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
            console.log("onContentChange");
            setEditorState(prev => ({ ...prev, content: newContent }));
        }
    });

    // Extract headings from markdown content - fallback for when editor instance is not available
    const extractHeadingsFromContent = (markdown: string) => {
        const headings: Array<{ id: string; level: number; text: string; lineIndex: number }> = [];
        const lines = markdown.split('\n');
        const headingRegex = /^(#{1,6})\s+(.*)$/;

        lines.forEach((line, index) => {
            const match = line.match(headingRegex);
            if (match) {
                const level = match[1].length;
                const text = match[2].trim();
                const id = `heading-${index}-${Date.now()}`;
                headings.push({ id, level, text, lineIndex: index });
            }
        });

        console.log('Extracted headings from content:');
        return headings;
    };

    // Extract headings directly from editor instance
    const extractHeadingsFromEditor = (editor: any) => {
        // For Toast UI Editor, we can get the markdown content directly from the editor
        // and then parse it for headings. This is more reliable than parsing from content state
        const markdown = editor.getMarkdown();
        const headings = extractHeadingsFromContent(markdown);
        console.log('Extracted headings from editor:', headings);
        return headings;
    };

    // Update TOC in context
    const updateTableOfContents = () => {
        console.log("updateTableOfContents");
        let headings;

        // Prioritize getting headings directly from editor instance if available
        if (editorRef.current) {
            headings = extractHeadingsFromEditor(editorRef.current);
        } else {
            // Fallback to extracting from content string
            headings = extractHeadingsFromContent(editorState.content);
        }

        if (noteContext) {
            noteContext.setContextData("toc", {
                headings,
                scrollToHeading: (targetHeading: { id: string; level: number; text: string; lineIndex: number }) => {
                    if (!editorRef.current) return;

                    try {
                        const editor = editorRef.current;

                        // Define different line heights for different content types
                        const lineHeights = editor.isWysiwygMode() ? {
                            content: 20.8,  // Regular content line height: 13px * 160% = 20.8px
                            h1: 28,         // Heading 1 line height from CSS
                            h2: 23,         // Heading 2 line height from CSS
                            h3: 18,         // Heading 3 line height from CSS
                            h4: 18,         // Heading 4 line height from CSS
                            h5: 17,         // Heading 5 line height from CSS
                            h6: 17          // Heading 6 line height from CSS
                        } : {
                            content: 19.5, // Regular content line height
                            h1: 36,      // Heading 1 line height
                            h2: 33,      // Heading 2 line height
                            h3: 30,      // Heading 3 line height
                            h4: 27,      // Heading 4 line height
                            h5: 24,      // Heading 5 line height
                            h6: 21       // Heading 6 line height
                        };

                        // Get the current content directly from editor
                        const content = editor.getMarkdown();
                        const lines = content.split('\n');
                        let scrollPosition = 0;

                        // Iterate through all lines up to the target heading's line index
                        for (let i = 0; i < targetHeading.lineIndex; i++) {
                            const line = lines[i];
                            const match = line.match(/^\s*(#{1,6})\s+(.*)$/);

                            if (match) {
                                // This is a heading, use heading line height
                                const headingLevel = match[1].length;
                                const headingType = `h${headingLevel}` as keyof typeof lineHeights;
                                scrollPosition += lineHeights[headingType];
                                if (i === 0 && headingLevel === 1) {
                                    scrollPosition -= 38;
                                }
                            } else {
                                // This is regular content, use content line height
                                scrollPosition += lineHeights.content;
                            }
                        }

                        // Apply the calculated scroll position
                        editor.setScrollTop(scrollPosition);
                    } catch (error) {
                        console.error("Error scrolling to heading:", error);
                    }
                }
            });
        }
    };

    useEffect(() => {
        console.log("useEffect one");
        const initializeEditor = async () => {
            console.log("initializeEditor");
            setEditorState(prev => ({ ...prev, isLoading: true }));

            try {
                const blob = await note.getBlob();
                const markdownContent = blob?.content || "";
                setEditorState(prev => ({ ...prev, content: markdownContent }));

                // Update TOC initially
                updateTableOfContents();

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

                        // Update TOC on content change - now gets content directly from editor
                        updateTableOfContents();
                    });

                    setEditorState(prev => ({ ...prev, isEditorReady: true, isFallbackMode: false, isLoading: false }));

                    // Cleanup function
                    return () => {
                        try {
                            editor.destroy();
                            // Removed TOC clearing to prevent loss when switching notes
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

    // // Single unified TOC update effect for all cases
    // useEffect(() => {
    //     console.log("useEffect second");
    //     // Only update TOC if we have content or if content is empty but note is set
    //     // This ensures TOC is properly updated even for empty notes
    //     updateTableOfContents();

    //     // Refresh TOC after a short delay to ensure content is fully loaded
    //     // This helps with race conditions during note switching
    //     const timer = setTimeout(() => {
    //         updateTableOfContents();
    //     }, 100);

    //     return () => {
    //         clearTimeout(timer);
    //     };
    // }, [note, editorState.content, editorState.isLoading, editorState.isFallbackMode, noteContext]);

    // Remove component unmount cleanup that clears TOC data
    // This prevents TOC from disappearing when switching note types


    const handleFallbackInput = (e: Event) => {
        console.log("handleFallbackInput");
        const target = e.target as HTMLTextAreaElement;
        setEditorState(prev => ({ ...prev, content: target.value }));
        spacedUpdate.scheduleUpdate();
    };

    const handleFallbackKeyDown = (e: KeyboardEvent) => {
        console.log("handleFallbackKeyDown");
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

    // 应该在只有当前节点为markdown时执行
    updateTableOfContents();

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