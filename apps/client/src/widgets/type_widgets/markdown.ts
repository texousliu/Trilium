import TypeWidget from "./type_widget.js";
import type FNote from "../../entities/fnote.js";
import SpacedUpdate from "../../services/spaced_update.js";
import protectedSessionHolder from "../../services/protected_session_holder.js";
import server from "../../services/server.js";
import options from "../../services/options.js";
import { t } from "../../services/i18n.js";
import type { IVditor } from "vditor";

const TPL = /*html*/`
<div class="note-detail-markdown note-detail-printable" style="height: 100%">
    <style>
        .note-detail-markdown {
            height: 100%;
            font-family: var(--detail-font-family);
        }

        .vditor-container {
            height: 100%;
        }

        .vditor {
            border: none !important;
        }

        .vditor-toolbar {
            border-bottom: 1px solid var(--main-border-color) !important;
            background-color: var(--accented-background-color) !important;
        }

        .vditor-content {
            background-color: var(--main-background-color) !important;
        }

        .vditor-preview {
            background-color: var(--main-background-color) !important;
        }

        .vditor-ir {
            background-color: var(--main-background-color) !important;
        }

        .vditor-wysiwyg {
            background-color: var(--main-background-color) !important;
        }

        /* Dark theme support */
        body.theme-dark .vditor-toolbar {
            background-color: var(--accented-background-color) !important;
            border-color: var(--main-border-color) !important;
        }

        body.theme-dark .vditor-content,
        body.theme-dark .vditor-preview,
        body.theme-dark .vditor-ir,
        body.theme-dark .vditor-wysiwyg {
            background-color: var(--main-background-color) !important;
            color: var(--main-text-color) !important;
        }
    </style>

    <div class="vditor-container" id="vditor-editor"></div>
</div>
`;

export default class MarkdownTypeWidget extends TypeWidget {

    private vditor?: IVditor;
    private $container!: JQuery<HTMLElement>;
    private currentNoteId?: string;
    private isInitialized = false;

    constructor() {
        super();

        // 使用SpacedUpdate来防止频繁保存
        this.spacedUpdate = new SpacedUpdate(async () => {
            if (!this.noteContext) return;

            const { note } = this.noteContext;
            if (!note) return;

            const { noteId } = note;
            const data = this.getData();

            if (data === undefined) return;

            protectedSessionHolder.touchProtectedSessionIfNecessary(note);
            await server.put(`notes/${noteId}/data`, data, this.componentId);
            this.dataSaved();
        });
    }

    static getType() {
        return "markdown";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$container = this.$widget.find(".vditor-container");

        this.initialized = this.initVditor();

        super.doRender();
        return this.$widget;
    }

    async initVditor() {
        // 动态导入Vditor
        const Vditor = (await import("vditor")).default;

        // 导入Vditor样式
        await import("vditor/dist/index.css");

        const isDarkTheme = document.body.classList.contains("theme-dark");

        this.vditor = new Vditor(this.$container[0], {
            height: "100%",
            mode: "ir", // 即时渲染模式，类似于Typora
            theme: isDarkTheme ? "dark" : "classic",
            preview: {
                theme: {
                    current: isDarkTheme ? "dark" : "light"
                }
            },
            toolbar: [
                "emoji",
                "headings",
                "bold",
                "italic",
                "strike",
                "link",
                "|",
                "list",
                "ordered-list",
                "check",
                "outdent",
                "indent",
                "|",
                "quote",
                "line",
                "code",
                "inline-code",
                "insert-before",
                "insert-after",
                "|",
                "table",
                "upload",
                "|",
                "undo",
                "redo",
                "|",
                "edit-mode",
                "content-theme",
                "code-theme",
                "export",
                {
                    name: "more",
                    toolbar: [
                        "fullscreen",
                        "both",
                        "preview",
                        "info",
                        "help"
                    ]
                }
            ],
            counter: {
                enable: true,
                type: "text"
            },
            cache: {
                enable: false // 禁用缓存，使用Trilium自己的保存机制
            },
            input: (value: string) => {
                // 当内容变化时触发保存
                if (this.isInitialized && !options.is("databaseReadonly")) {
                    this.saveData();
                }
            },
            focus: (value: string) => {
                // 获得焦点时的处理
            },
            blur: (value: string) => {
                // 失去焦点时的处理
            },
            upload: {
                accept: "image/*,.mp3,.wav,.ogg,.mp4,.webm,.pdf,.txt,.md",
                handler: async (files: File[]) => {
                    // 处理文件上传
                    const results: string[] = [];

                    for (const file of files) {
                        try {
                            const formData = new FormData();
                            formData.append("upload", file);

                            const response = await server.post(`notes/${this.noteId}/attachments`, formData);

                            if (response.attachmentId) {
                                const attachment = await server.get(`attachments/${response.attachmentId}`);
                                if (file.type.startsWith("image/")) {
                                    results.push(`![${file.name}](api/attachments/${response.attachmentId}/download)`);
                                } else {
                                    results.push(`[${file.name}](api/attachments/${response.attachmentId}/download)`);
                                }
                            }
                        } catch (error) {
                            console.error("Upload failed:", error);
                            results.push(`Upload failed: ${file.name}`);
                        }
                    }

                    return results.join("\n");
                }
            },
            hint: {
                emojiPath: "https://cdn.jsdelivr.net/npm/vditor@3.10.4/dist/images/emoji"
            }
        });

        this.isInitialized = true;
    }

    async doRefresh(note: FNote) {
        if (!this.vditor) {
            await this.initVditor();
        }

        // 检查是否切换了笔记
        const noteChanged = this.currentNoteId !== note.noteId;
        this.currentNoteId = note.noteId;

        const blob = await note.getBlob();
        const content = blob?.content || "";

        // 暂时禁用自动保存，避免在加载内容时触发保存
        this.isInitialized = false;

        // 设置内容
        this.vditor?.setValue(content);

        // 重新启用自动保存
        setTimeout(() => {
            this.isInitialized = true;
        }, 100);
    }

    getData() {
        if (!this.vditor) {
            return undefined;
        }

        const content = this.vditor.getValue();

        return {
            content: content || ""
        };
    }

    focus() {
        if (this.vditor) {
            this.vditor.focus();
        }
    }

    scrollToEnd() {
        // Vditor没有直接的scrollToEnd方法，可以通过DOM操作实现
        const editorElement = this.$container.find(".vditor-ir").get(0);
        if (editorElement) {
            editorElement.scrollTop = editorElement.scrollHeight;
        }
    }

    saveData() {
        if (options.is("databaseReadonly")) {
            return;
        }

        this.spacedUpdate.resetUpdateTimer();
        this.spacedUpdate.scheduleUpdate();
    }

    cleanup() {
        if (this.vditor) {
            this.vditor.destroy();
            this.vditor = undefined;
        }

        this.isInitialized = false;
        super.cleanup();
    }

    // 支持主题切换
    async themeChangedEvent() {
        if (this.vditor) {
            const isDarkTheme = document.body.classList.contains("theme-dark");

            // 重新初始化编辑器以应用新主题
            const content = this.vditor.getValue();
            this.vditor.destroy();

            await this.initVditor();
            this.vditor?.setValue(content);
        }
    }

    // 导出功能
    exportMarkdown() {
        if (!this.vditor || !this.note) {
            return;
        }

        const content = this.vditor.getValue();
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.note.title}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 导出HTML
    exportHtml() {
        if (!this.vditor || !this.note) {
            return;
        }

        const html = this.vditor.getHTML();
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `${this.note.title}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
