import TypeWidget from "./type_widget.js";
import type FNote from "../../entities/fnote.js";
import SpacedUpdate from "../../services/spaced_update.js";
import protectedSessionHolder from "../../services/protected_session_holder.js";
import server from "../../services/server.js";
import options from "../../services/options.js";
// import { t } from "../../services/i18n.js"; // 暂时不需要
import type Editor from "@toast-ui/editor";

const TPL = /*html*/`
<div class="note-detail-markdown note-detail-printable" style="height: 100%">
    <style>
        .note-detail-markdown {
            height: 100%;
            font-family: var(--detail-font-family);
        }

        .toast-ui-editor-container {
            height: 100%;
        }

        /* Toast UI Editor 基础样式 */
        .toastui-editor {
            border: none !important;
            height: 100% !important;
        }

        .toastui-editor-defaultUI {
            border: none !important;
        }

        .toastui-editor-toolbar {
            border-bottom: 1px solid var(--main-border-color) !important;
            background-color: var(--accented-background-color) !important;
        }

        .toastui-editor-md-container,
        .toastui-editor-ww-container {
            background-color: var(--main-background-color) !important;
        }

        .toastui-editor-md-preview {
            background-color: var(--main-background-color) !important;
        }

        .CodeMirror {
            background-color: var(--main-background-color) !important;
            color: var(--main-text-color) !important;
        }

        /* Dark theme support */
        body.theme-dark .toastui-editor-toolbar,
        body.dark .toastui-editor-toolbar,
        body.theme-next-dark .toastui-editor-toolbar,
        body[data-theme="dark"] .toastui-editor-toolbar {
            background-color: var(--accented-background-color) !important;
            border-color: var(--main-border-color) !important;
        }

        body.theme-dark .toastui-editor-md-container,
        body.theme-dark .toastui-editor-ww-container,
        body.theme-dark .toastui-editor-md-preview,
        body.dark .toastui-editor-md-container,
        body.dark .toastui-editor-ww-container,
        body.dark .toastui-editor-md-preview,
        body.theme-next-dark .toastui-editor-md-container,
        body.theme-next-dark .toastui-editor-ww-container,
        body.theme-next-dark .toastui-editor-md-preview,
        body[data-theme="dark"] .toastui-editor-md-container,
        body[data-theme="dark"] .toastui-editor-ww-container,
        body[data-theme="dark"] .toastui-editor-md-preview {
            background-color: var(--main-background-color) !important;
            color: var(--main-text-color) !important;
        }

        body.theme-dark .CodeMirror,
        body.dark .CodeMirror,
        body.theme-next-dark .CodeMirror,
        body[data-theme="dark"] .CodeMirror {
            background-color: var(--main-background-color) !important;
            color: var(--main-text-color) !important;
        }

        /* Dark theme toolbar buttons */
        body.theme-dark .toastui-editor-toolbar-icons,
        body.dark .toastui-editor-toolbar-icons,
        body.theme-next-dark .toastui-editor-toolbar-icons,
        body[data-theme="dark"] .toastui-editor-toolbar-icons {
            color: var(--main-text-color) !important;
        }

        body.theme-dark .toastui-editor-toolbar-icons:hover,
        body.dark .toastui-editor-toolbar-icons:hover,
        body.theme-next-dark .toastui-editor-toolbar-icons:hover,
        body[data-theme="dark"] .toastui-editor-toolbar-icons:hover {
            background-color: var(--button-background-color-hover) !important;
        }

        /* Dark theme scrollbars */
        body.theme-dark .CodeMirror-scroll::-webkit-scrollbar,
        body.dark .CodeMirror-scroll::-webkit-scrollbar,
        body.theme-next-dark .CodeMirror-scroll::-webkit-scrollbar,
        body[data-theme="dark"] .CodeMirror-scroll::-webkit-scrollbar {
            background-color: var(--main-background-color) !important;
        }

        body.theme-dark .CodeMirror-scroll::-webkit-scrollbar-thumb,
        body.dark .CodeMirror-scroll::-webkit-scrollbar-thumb,
        body.theme-next-dark .CodeMirror-scroll::-webkit-scrollbar-thumb,
        body[data-theme="dark"] .CodeMirror-scroll::-webkit-scrollbar-thumb {
            background-color: var(--main-border-color) !important;
        }

        /* 隐藏模式切换按钮（如果需要的话） */
        .toastui-editor-mode-switch {
            display: none;
        }

        /* 只读模式样式 */
        .readonly-mode .toastui-editor-toolbar {
            opacity: 0.5;
            background-color: var(--accented-background-color) !important;
        }

        .readonly-mode .CodeMirror {
            background-color: var(--accented-background-color) !important;
            cursor: not-allowed;
        }

        .readonly-mode .toastui-editor.readonly {
            opacity: 0.8;
        }

        /* 确保编辑器可见性 */
        .toastui-editor {
            opacity: 1 !important;
            visibility: visible !important;
        }

        .CodeMirror {
            height: auto !important;
            min-height: 300px !important;
        }
    </style>

    <div class="toast-ui-editor-container"></div>
</div>
`;

export default class MarkdownTypeWidget extends TypeWidget {

    private editor?: Editor;
    private $container!: JQuery<HTMLElement>;
    private currentNoteId?: string;
    private isEditorReady = false;
    private isFallbackMode = false;

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
        this.$container = this.$widget.find(".toast-ui-editor-container");

        super.doRender();

        // 确保DOM元素已经添加到页面中
        this.initialized = Promise.resolve();

        // 监听主题变化
        this.setupThemeObserver();

        return this.$widget;
    }

    async initEditor(): Promise<void> {
        if (this.editor) {
            return;
        }

        // 确保DOM容器存在且已添加到页面
        if (!this.$container || !this.$container.length || !this.$container[0].isConnected) {
            throw new Error("Toast UI Editor container not ready");
        }

        try {
            console.log("Initializing Toast UI Editor...");

            // 动态导入 Toast UI Editor
            const { default: Editor } = await import("@toast-ui/editor");

            // 导入样式
            await import("@toast-ui/editor/dist/toastui-editor.css");

            // 根据主题加载暗色主题样式
            if (this.isDarkTheme()) {
                await import("@toast-ui/editor/dist/theme/toastui-editor-dark.css");
            }

            // 清空容器
            this.$container.empty();

            console.log("Creating Toast UI Editor instance...");

            // 创建编辑器实例
            this.editor = new Editor({
                el: this.$container[0],
                height: "100%",
                initialEditType: "markdown",
                previewStyle: "vertical",
                theme: this.isDarkTheme() ? "dark" : "light",
                usageStatistics: false,
                hideModeSwitch: false,
                initialValue: "",
                toolbarItems: [
                    ["heading", "bold", "italic", "strike"],
                    ["hr", "quote"],
                    ["ul", "ol", "task", "indent", "outdent"],
                    ["table", "image", "link"],
                    ["code", "codeblock"],
                    ["scrollSync"]
                ],
                events: {
                    change: () => {
                        if (this.isEditorReady && !options.is("databaseReadonly")) {
                            this.saveData();
                        }
                    }
                },
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

            console.log("Toast UI Editor created successfully");

            // 等待编辑器完全初始化
            await new Promise(resolve => setTimeout(resolve, 200));

            // 检查编辑器是否正确创建
            if (!this.editor || !this.$container.find('.toastui-editor').length) {
                throw new Error("Editor not properly initialized");
            }

            console.log("Toast UI Editor initialization complete");

        } catch (error) {
            console.error("Error initializing Toast UI Editor:", error);
            throw error;
        }
    }

    async doRefresh(note: FNote) {
        if (note.type !== "markdown") {
            return;
        }

        this.currentNoteId = note.noteId;

        const blob = await note.getBlob();
        const content = blob?.content || "";

        // 等待DOM准备好
        await this.initialized;

        // 异步初始化编辑器，避免阻塞主流程
        this.initializeEditorAsync(content);
    }

    private async initializeEditorAsync(content: string) {
        try {
            // 显示加载状态
            this.showLoadingState();

            // 尝试初始化 Toast UI Editor
            if (!this.editor) {
                await this.initEditor();
            }

            // 设置内容
            await this.safeSetValue(content);

            // 更新只读模式
            await this.updateReadOnlyMode();

            // 启用自动保存
            setTimeout(() => {
                this.isEditorReady = true;
            }, 100);

            console.log("Markdown editor initialized successfully with Toast UI Editor");

        } catch (error) {
            console.error("Toast UI Editor failed, falling back to simple editor:", error);
            this.initializeFallbackEditor(content);
        }
    }

    private initializeFallbackEditor(content: string) {
        console.log("Initializing fallback markdown editor");

        // 使用简单的 textarea 作为回退方案
        const fallbackHtml = `
            <div style="height: 100%; display: flex; flex-direction: column;">
                <div style="
                    background: var(--accented-background-color);
                    border-bottom: 1px solid var(--main-border-color);
                    padding: 8px 12px;
                    font-size: 12px;
                    color: var(--muted-text-color);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span>📝</span>
                    <span>简化 Markdown 编辑器</span>
                    <span style="opacity: 0.7;">(Toast UI Editor 不可用)</span>
                </div>
                <textarea
                    class="fallback-markdown-editor"
                    style="
                        flex: 1;
                        border: none;
                        outline: none;
                        padding: 16px;
                        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                        font-size: 14px;
                        line-height: 1.6;
                        background-color: var(--main-background-color);
                        color: var(--main-text-color);
                        resize: none;
                        tab-size: 4;
                    "
                    placeholder="在这里输入 Markdown 内容...

支持的 Markdown 语法：
# 标题
**粗体** *斜体*
- 列表项
[链接](url)
\`代码\`
"
                >${this.escapeHtml(content)}</textarea>
            </div>
        `;

        this.$container.html(fallbackHtml);

        // 绑定事件
        const $textarea = this.$container.find('.fallback-markdown-editor');

        // 输入事件
        $textarea.on('input', () => {
            if (!options.is("databaseReadonly")) {
                this.saveData();
            }
        });

        // Tab 键支持
        $textarea.on('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const textarea = e.target as HTMLTextAreaElement;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const value = textarea.value;

                // 插入 tab 或 4 个空格
                const tabChar = '    ';
                textarea.value = value.substring(0, start) + tabChar + value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + tabChar.length;

                // 触发保存
                if (!options.is("databaseReadonly")) {
                    this.saveData();
                }
            }
        });

        // 设置为可编辑状态
        this.isEditorReady = true;
        this.isFallbackMode = true;

        console.log("Fallback markdown editor initialized successfully");
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private showLoadingState() {
        const loadingHtml = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 200px;
                color: var(--muted-text-color);
                font-size: 14px;
            ">
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px;">⏳</div>
                    <div>正在加载 Markdown 编辑器...</div>
                </div>
            </div>
        `;
        this.$container.html(loadingHtml);
    }

    private showInitializationError(error: any) {
        const errorHtml = `
            <div style="
                padding: 20px;
                text-align: center;
                color: var(--muted-text-color);
                border: 1px solid var(--main-border-color);
                border-radius: 4px;
                margin: 20px;
            ">
                <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                <h3 style="margin: 10px 0; color: var(--main-text-color);">Markdown 编辑器初始化失败</h3>
                <p>Toast UI Editor 无法正常加载。</p>
                <details style="margin: 15px 0; text-align: left;">
                    <summary style="cursor: pointer; color: var(--main-text-color);">错误详情</summary>
                    <pre style="
                        background: var(--accented-background-color);
                        padding: 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        overflow-x: auto;
                        margin-top: 10px;
                    ">${error?.message || '未知错误'}</pre>
                </details>
                <button onclick="location.reload()" style="
                    margin-top: 15px;
                    padding: 8px 16px;
                    background: var(--button-background-color);
                    color: var(--button-text-color);
                    border: 1px solid var(--main-border-color);
                    border-radius: 4px;
                    cursor: pointer;
                ">重新加载页面</button>
            </div>
        `;
        this.$container.html(errorHtml);
    }

    getData() {
        if (this.isFallbackMode) {
            const $textarea = this.$container.find('.fallback-markdown-editor');
            const content = $textarea.val() as string;
            return {
                content: content || ""
            };
        }

        if (!this.editor) {
            return undefined;
        }

        const content = this.editor.getMarkdown();
        return {
            content: content || ""
        };
    }

    focus() {
        if (this.isFallbackMode) {
            this.$container.find('.fallback-markdown-editor').focus();
        } else if (this.editor) {
            this.editor.focus();
        }
    }

    scrollToEnd() {
        if (this.editor) {
            // 移动光标到末尾
            this.editor.moveCursorToEnd();

            // 滚动到底部
            const editorElement = this.$container.find(".CodeMirror-scroll").get(0);
            if (editorElement) {
                editorElement.scrollTop = editorElement.scrollHeight;
            }
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

        if (this.isFallbackMode) {
            this.$container.find('.fallback-markdown-editor').off();
        }

        if (this.editor) {
            try {
                this.editor.destroy();
            } catch (e) {
                console.warn("Error destroying Toast UI Editor:", e);
            }
            this.editor = undefined;
        }

        this.isEditorReady = false;
        this.isFallbackMode = false;
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
        if (!this.editor || !this.note) {
            return;
        }

        const content = this.editor.getMarkdown();
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
        if (!this.editor || !this.note) {
            return;
        }

        const html = this.editor.getHTML();
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
        if (this.editor) {
            console.log("Theme changed, updating editor theme");

            // 暂时不重新初始化编辑器，只更新CSS样式
            // Toast UI Editor 的主题主要通过CSS控制
            const isDark = this.isDarkTheme();

            // 更新编辑器主题相关的CSS类
            if (isDark) {
                this.$container.addClass('dark-theme');
                this.$container.removeClass('light-theme');
            } else {
                this.$container.addClass('light-theme');
                this.$container.removeClass('dark-theme');
            }

            console.log("Theme updated to:", isDark ? "dark" : "light");
        }
    }

    // 更新只读模式
    async updateReadOnlyMode() {
        if (!this.editor || !this.noteContext) {
            return;
        }

        try {
            const isReadOnly = await this.noteContext.isReadOnly();
            console.log("Updating readonly mode:", isReadOnly);

            if (isReadOnly) {
                // 禁用编辑器
                this.$container.addClass('readonly-mode');

                // 禁用工具栏和编辑区域
                this.$container.find('.toastui-editor-toolbar').css('pointer-events', 'none');
                this.$container.find('.toastui-editor-md-container').css('pointer-events', 'none');
                this.$container.find('.CodeMirror').css('pointer-events', 'none');

                // 添加只读样式
                this.$container.find('.toastui-editor').addClass('readonly');
            } else {
                // 启用编辑器
                this.$container.removeClass('readonly-mode');

                // 启用工具栏和编辑区域
                this.$container.find('.toastui-editor-toolbar').css('pointer-events', 'auto');
                this.$container.find('.toastui-editor-md-container').css('pointer-events', 'auto');
                this.$container.find('.CodeMirror').css('pointer-events', 'auto');

                // 移除只读样式
                this.$container.find('.toastui-editor').removeClass('readonly');
            }
        } catch (error) {
            console.error("Error updating readonly mode:", error);
        }
    }

    // 安全地设置编辑器内容
    private async safeSetValue(content: string) {
        if (!this.editor) {
            throw new Error("Editor not initialized when trying to set content");
        }

        // 减少重试次数和等待时间，加快响应速度
        let retries = 0;
        const maxRetries = 5;

        while (retries < maxRetries) {
            try {
                if (this.editor && typeof this.editor.setMarkdown === 'function') {
                    this.isEditorReady = false;
                    this.editor.setMarkdown(content || "", false);

                    // 延迟启用事件监听
                    setTimeout(() => {
                        this.isEditorReady = true;
                    }, 100);

                    return;
                }
            } catch (error) {
                if (retries === maxRetries - 1) {
                    throw error;
                }
            }

            retries++;
            // 减少等待时间
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        throw new Error("Failed to set editor content after retries");
    }
}
