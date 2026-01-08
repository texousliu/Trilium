import { useEffect, useRef, useState } from "preact/hooks";
import type FNote from "../../entities/fnote.js";
import { TypeWidgetProps } from "./type_widget.js";

export default function ReadOnlyMarkdown({ note, viewScope, ntxId, parentComponent, noteContext }: TypeWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState("");

    useEffect(() => {
        const initializeViewer = async () => {
            setIsLoading(true);

            try {
                const blob = await note.getBlob();
                const markdownContent = blob?.content || "";
                setContent(markdownContent);

                // Try to load Toast UI Editor Viewer
                try {
                    const { default: Viewer } = await import("@toast-ui/editor/dist/toastui-editor-viewer");
                    await import("@toast-ui/editor/dist/toastui-editor-viewer.css");

                    if (!containerRef.current) return;

                    // Create viewer instance
                    const viewer = new Viewer({
                        el: containerRef.current,
                        initialValue: markdownContent,
                        usageStatistics: false
                    });

                    setIsLoading(false);

                    // Cleanup function
                    return () => {
                        try {
                            viewer.destroy();
                        } catch (e) {
                            console.warn("Error destroying Toast UI Viewer:", e);
                        }
                    };
                } catch (error) {
                    console.error("Failed to initialize Toast UI Viewer, falling back to simple HTML:", error);
                    // Fallback to simple HTML display
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error initializing ReadOnly Markdown viewer:", error);
                setIsLoading(false);
            }
        };

        initializeViewer();
    }, [note]);

    const escapeHtml = (text: string): string => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    return (
        <div className="note-detail-readonly-markdown note-detail-printable" tabindex="100" style={{ height: "100%" }}>
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-readonly-markdown">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">Loading Markdown...</div>
                    </div>
                </div>
            )}

            <div ref={containerRef} className="note-detail-readonly-markdown-content"></div>

            <style>{`
                .note-detail-readonly-markdown {
                    padding: 20px;
                    font-family: var(--detail-font-family);
                    min-height: 50px;
                    overflow-y: auto;
                    position: relative;
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

                .note-detail-readonly-markdown h1 { font-size: 1.8em; margin-top: 0.5em; }
                .note-detail-readonly-markdown h2 { font-size: 1.6em; margin-top: 0.5em; }
                .note-detail-readonly-markdown h3 { font-size: 1.4em; margin-top: 0.5em; }
                .note-detail-readonly-markdown h4 { font-size: 1.2em; margin-top: 0.5em; }
                .note-detail-readonly-markdown h5 { font-size: 1.1em; margin-top: 0.5em; }
                .note-detail-readonly-markdown h6 { font-size: 1.0em; margin-top: 0.5em; }

                .note-detail-readonly-markdown p {
                    margin: 0.5em 0;
                    line-height: 1.6;
                }

                .note-detail-readonly-markdown img {
                    max-width: 100%;
                    height: auto;
                }

                .note-detail-readonly-markdown pre {
                    background-color: var(--accented-background-color);
                    padding: 10px;
                    border-radius: 4px;
                    overflow-x: auto;
                }

                .note-detail-readonly-markdown code {
                    background-color: var(--accented-background-color);
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                    font-size: 0.9em;
                }

                .note-detail-readonly-markdown pre code {
                    background-color: transparent;
                    padding: 0;
                }

                .note-detail-readonly-markdown blockquote {
                    border-left: 4px solid var(--main-border-color);
                    padding-left: 16px;
                    margin-left: 0;
                    color: var(--muted-text-color);
                }

                .note-detail-readonly-markdown table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1em 0;
                }

                .note-detail-readonly-markdown table th,
                .note-detail-readonly-markdown table td {
                    border: 1px solid var(--main-border-color);
                    padding: 8px;
                    text-align: left;
                }

                .note-detail-readonly-markdown table th {
                    background-color: var(--accented-background-color);
                    font-weight: bold;
                }

                .note-detail-readonly-markdown ul,
                .note-detail-readonly-markdown ol {
                    padding-left: 2em;
                    margin: 0.5em 0;
                }

                .note-detail-readonly-markdown li {
                    margin: 0.25em 0;
                }

                .note-detail-readonly-markdown a {
                    color: var(--link-color);
                    text-decoration: none;
                }

                .note-detail-readonly-markdown a:hover {
                    text-decoration: underline;
                }

                .note-detail-readonly-markdown hr {
                    border: none;
                    border-top: 1px solid var(--main-border-color);
                    margin: 1em 0;
                }

                .loading-readonly-markdown {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 200px;
                    color: var(--muted-text-color);
                }

                .loading-spinner {
                    width: 30px;
                    height: 30px;
                    border: 2px solid var(--main-border-color);
                    border-top: 2px solid var(--primary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .fallback-readonly-markdown {
                    background-color: var(--accented-background-color);
                    padding: 10px;
                    border-radius: 4px;
                    overflow-x: auto;
                }
            `}</style>
        </div>
    );
}