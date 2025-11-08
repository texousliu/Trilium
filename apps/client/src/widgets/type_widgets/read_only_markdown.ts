import TypeWidget from "./type_widget.js";
import type FNote from "../../entities/fnote.js";
import type Viewer from "@toast-ui/editor/types/viewer";

const TPL = /*html*/`
<div class="note-detail-readonly-markdown note-detail-printable" tabindex="100">
    <style>
    .note-detail-readonly-markdown {
        padding: 20px;
        font-family: var(--detail-font-family);
        min-height: 50px;
        overflow-y: auto;
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
    </style>

    <div class="note-detail-readonly-markdown-content"></div>
</div>
`;

export default class ReadOnlyMarkdownTypeWidget extends TypeWidget {

    private $content!: JQuery<HTMLElement>;
    private viewer?: Viewer;

    static getType() {
        return "readOnlyMarkdown";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$content = this.$widget.find(".note-detail-readonly-markdown-content");
        super.doRender();
    }

    async doRefresh(note: FNote) {
        const blob = await note.getBlob();
        const markdownContent = blob?.content || "";

        try {
            // 使用 Toast UI Editor Viewer 来渲染 Markdown
            const { default: Viewer } = await import("@toast-ui/editor/dist/toastui-editor-viewer");
            await import("@toast-ui/editor/dist/toastui-editor-viewer.css");

            // 清理旧的 viewer
            if (this.viewer) {
                try {
                    this.viewer.destroy();
                } catch (e) {
                    // 忽略清理错误
                }
            }

            // 清空容器
            this.$content.empty();

            // 创建 viewer 实例
            this.viewer = new Viewer({
                el: this.$content[0],
                initialValue: markdownContent,
                usageStatistics: false
            });

        } catch (error) {
            console.error("Failed to initialize Toast UI Viewer, using simple HTML:", error);
            // 回退到简单的 HTML 显示
            this.$content.html(`<pre style="white-space: pre-wrap; word-wrap: break-word;">${this.escapeHtml(markdownContent)}</pre>`);
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    cleanup() {
        if (this.viewer) {
            try {
                this.viewer.destroy();
            } catch (e) {
                console.warn("Error destroying Toast UI Viewer:", e);
            }
            this.viewer = undefined;
        }
        this.$content.html("");
    }
}
