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

        /* Dark theme support - multiple theme class variations */
        body.theme-dark .vditor-toolbar,
        body.dark .vditor-toolbar,
        body.theme-next-dark .vditor-toolbar,
        body[data-theme="dark"] .vditor-toolbar {
            background-color: var(--accented-background-color) !important;
            border-color: var(--main-border-color) !important;
            color: var(--main-text-color) !important;
        }

        body.theme-dark .vditor-content,
        body.theme-dark .vditor-preview,
        body.theme-dark .vditor-ir,
        body.theme-dark .vditor-wysiwyg,
        body.dark .vditor-content,
        body.dark .vditor-preview,
        body.dark .vditor-ir,
        body.dark .vditor-wysiwyg,
        body.theme-next-dark .vditor-content,
        body.theme-next-dark .vditor-preview,
        body.theme-next-dark .vditor-ir,
        body.theme-next-dark .vditor-wysiwyg,
        body[data-theme="dark"] .vditor-content,
        body[data-theme="dark"] .vditor-preview,
        body[data-theme="dark"] .vditor-ir,
        body[data-theme="dark"] .vditor-wysiwyg {
            background-color: var(--main-background-color) !important;
            color: var(--main-text-color) !important;
        }

        /* Dark theme toolbar buttons */
        body.theme-dark .vditor-toolbar .vditor-tooltipped,
        body.dark .vditor-toolbar .vditor-tooltipped,
        body.theme-next-dark .vditor-toolbar .vditor-tooltipped,
        body[data-theme="dark"] .vditor-toolbar .vditor-tooltipped {
            color: var(--main-text-color) !important;
        }

        body.theme-dark .vditor-toolbar .vditor-tooltipped:hover,
        body.dark .vditor-toolbar .vditor-tooltipped:hover,
        body.theme-next-dark .vditor-toolbar .vditor-tooltipped:hover,
        body[data-theme="dark"] .vditor-toolbar .vditor-tooltipped:hover {
            background-color: var(--button-background-color-hover) !important;
        }

        /* Dark theme editor text */
        body.theme-dark .vditor-ir .vditor-ir__node,
        body.dark .vditor-ir .vditor-ir__node,
        body.theme-next-dark .vditor-ir .vditor-ir__node,
        body[data-theme="dark"] .vditor-ir .vditor-ir__node {
            color: var(--main-text-color) !important;
        }

        /* Dark theme scrollbars */
        body.theme-dark .vditor-ir::-webkit-scrollbar,
        body.dark .vditor-ir::-webkit-scrollbar,
        body.theme-next-dark .vditor-ir::-webkit-scrollbar,
        body[data-theme="dark"] .vditor-ir::-webkit-scrollbar {
            background-color: var(--main-background-color) !important;
        }

        body.theme-dark .vditor-ir::-webkit-scrollbar-thumb,
        body.dark .vditor-ir::-webkit-scrollbar-thumb,
        body.theme-next-dark .vditor-ir::-webkit-scrollbar-thumb,
        body[data-theme="dark"] .vditor-ir::-webkit-scrollbar-thumb {
            background-color: var(--main-border-color) !important;
        }

        /* Force dark theme for vditor when body has dark theme */
        body.theme-dark .vditor,
        body.dark .vditor,
        body.theme-next-dark .vditor,
        body[data-theme="dark"] .vditor {
            --vditor-background-color: var(--main-background-color) !important;
            --vditor-text-color: var(--main-text-color) !important;
            --vditor-border-color: var(--main-border-color) !important;
        }

        /* Dark theme for vditor counter */
        body.theme-dark .vditor-counter,
        body.dark .vditor-counter,
        body.theme-next-dark .vditor-counter,
        body[data-theme="dark"] .vditor-counter {
            color: var(--muted-text-color) !important;
            background-color: var(--accented-background-color) !important;
        }

        /* Dark theme for vditor resize handle */
        body.theme-dark .vditor-resize,
        body.dark .vditor-resize,
        body.theme-next-dark .vditor-resize,
        body[data-theme="dark"] .vditor-resize {
            background-color: var(--main-border-color) !important;
        }
    </style>

    <div class="vditor-container"></div>
</div>
`;

export default class MarkdownTypeWidget extends TypeWidget {

    private vditor?: IVditor;
    private $container!: JQuery<HTMLElement>;
    private currentNoteId?: string;
    private isVditorReady = false;

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

        super.doRender();

        // 确保DOM元素已经添加到页面中
        this.initialized = Promise.resolve();

        // 监听主题变化
        this.setupThemeObserver();

        return this.$widget;
    }

    async initVditor(): Promise<void> {
        if (this.vditor) {
            return;
        }

        // 确保DOM容器存在且已添加到页面
        if (!this.$container || !this.$container.length || !this.$container[0].isConnected) {
            console.warn("Vditor container not ready");
            return;
        }

        // 动态导入Vditor
        const Vditor = (await import("vditor")).default;
        await import("vditor/dist/index.css");

        const isDarkTheme = this.isDarkTheme();

        return new Promise<void>((resolve, reject) => {
            try {
                this.vditor = new Vditor(this.$container[0], {
                    height: "100%",
                    mode: "sv",
                    theme: isDarkTheme ? "dark" : "classic",
                    preview: {
                        theme: {
                            current: isDarkTheme ? "dark" : "light"
                        }
                    },
                    toolbar: [
                        "headings", "bold", "italic", "strike", "|",
                        "list", "ordered-list", "check", "|",
                        "quote", "line", "code", "table", "|",
                        "undo", "redo", "|",
                        "edit-mode", "both", "preview"
                    ],
                    counter: {
                        enable: true,
                        type: "text"
                    },
                    cache: {
                        enable: false
                    },
                    input: (value: string) => {
                        if (this.isVditorReady && !options.is("databaseReadonly")) {
                            this.saveData();
                        }
                    },
                    after: () => {
                        this.isVditorReady = true;
                        this.updateReadOnlyMode();
                        resolve(); // 确保Promise在初始化完成后resolve
                    },
                    customWysiwygToolbar: () => {

                    },
                });
            } catch (error) {
                console.error("Error initializing Vditor:", error);
                reject(error);
            }
        });
    }

    async doRefresh(note: FNote) {
        if (note.type !== "markdown") {
            return;
        }

        const noteChanged = this.currentNoteId !== note.noteId;
        this.currentNoteId = note.noteId;

        const blob = await note.getBlob();
        const content = blob?.content || "";

        // 等待DOM准备好
        await this.initialized;

        // 如果vditor不存在，先初始化
        if (!this.vditor) {
            try {
                await this.initVditor();
            } catch (error) {
                console.error("Failed to initialize Vditor:", error);
                return;
            }
        }

        // 暂时禁用自动保存
        this.isVditorReady = false;

        // 安全地设置内容
        await this.safeSetValue(content);

        // 更新只读模式
        await this.updateReadOnlyMode();

        // 重新启用自动保存
        setTimeout(() => {
            this.isVditorReady = true;
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
        // 清理主题观察器
        if ((this as any).themeObserver) {
            (this as any).themeObserver.disconnect();
            (this as any).themeObserver = null;
        }

        if (this.vditor) {
            try {
                this.vditor.destroy();
            } catch (e) {
                console.warn("Error destroying vditor:", e);
            }
            this.vditor = undefined;
        }

        this.isVditorReady = false;
        this.currentNoteId = undefined;
        super.cleanup();
    }

    // 支持主题切换
    async themeChangedEvent() {
        // 使用统一的主题变化处理方法
        await this.handleThemeChange();
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

    // 检测是否为暗色主题
    private isDarkTheme(): boolean {
        // 检查多种可能的暗色主题标识
        const body = document.body;
        return body.classList.contains("theme-dark") ||
               body.classList.contains("dark") ||
               body.classList.contains("theme-next-dark") ||
               body.getAttribute('data-theme') === 'dark' ||
               getComputedStyle(body).getPropertyValue('--theme-style')?.trim() === 'dark';
    }

    // 设置主题观察器
    private setupThemeObserver() {
        // 使用MutationObserver监听body类名变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' &&
                    (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme')) {
                    // 延迟一点执行，确保CSS变量已更新
                    setTimeout(() => {
                        this.handleThemeChange();
                    }, 100);
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-theme']
        });

        // 保存observer引用以便清理
        (this as any).themeObserver = observer;
    }

    // 处理主题变化
    private async handleThemeChange() {
        if (this.vditor) {
            const currentTheme = this.isDarkTheme() ? 'dark' : 'classic';
            const currentPreviewTheme = this.isDarkTheme() ? 'dark' : 'light';

            // 检查是否需要更新主题
            const vditorInstance = (this.vditor as any).vditor;
            if (vditorInstance && vditorInstance.options) {
                const needsUpdate = vditorInstance.options.theme !== currentTheme ||
                                  vditorInstance.options.preview?.theme?.current !== currentPreviewTheme;

                if (needsUpdate) {
                    // 保存当前内容
                    const content = this.vditor.getValue();

                    // 重新初始化编辑器
                    this.cleanup();
                    await this.initVditor();
                    await this.safeSetValue(content);
                }
            }
        }
    }

    // 更新只读模式
    async updateReadOnlyMode() {
        if (!this.vditor || !this.noteContext) {
            return;
        }

        const isReadOnly = await this.noteContext.isReadOnly();

        if (isReadOnly) {
            this.vditor.disabled();
        } else {
            this.vditor.enable();
        }
    }

    // 安全地设置Vditor内容
    private async safeSetValue(content: string) {
        if (!this.vditor) {
            return;
        }

        // 等待Vditor完全准备好
        let retries = 0;
        const maxRetries = 20;

        while (retries < maxRetries) {
            try {
                // 检查Vditor是否有必要的内部属性
                if ((this.vditor as any).vditor && (this.vditor as any).vditor.ir) {
                    this.vditor.setValue(content);
                    return; // 成功设置，退出
                }
            } catch (error) {
                // 继续重试
            }

            retries++;
            if (retries >= maxRetries) {
                console.error("Failed to set vditor value after retries, vditor may not be fully initialized");
                return;
            }
            // 等待100ms后重试
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}
