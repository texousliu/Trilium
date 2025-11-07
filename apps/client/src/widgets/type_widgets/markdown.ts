import TypeWidget from "./type_widget.js";
import type FNote from "../../entities/fnote.js";
import SpacedUpdate from "../../services/spaced_update.js";
import protectedSessionHolder from "../../services/protected_session_holder.js";
import server from "../../services/server.js";
import options from "../../services/options.js";
import type Editor from "@toast-ui/editor";

// 全局 Toast UI Editor 管理器
class MarkdownEditorManager {
    private static instance: MarkdownEditorManager;
    private editor: Editor | null = null;
    private isInitialized = false;
    private isInitializing = false;
    private initPromise: Promise<void> | null = null;
    private currentContainer: HTMLElement | null = null;
    private currentWidget: MarkdownTypeWidget | null = null;
    private editorContainer: HTMLElement | null = null;

    static getInstance(): MarkdownEditorManager {
        if (!MarkdownEditorManager.instance) {
            MarkdownEditorManager.instance = new MarkdownEditorManager();
        }
        return MarkdownEditorManager.instance;
    }

    async initializeEditor(): Promise<void> {
        if (this.isInitialized && this.editor) {
            return;
        }

        if (this.isInitializing && this.initPromise) {
            return this.initPromise;
        }

        this.isInitializing = true;
        this.initPromise = this.doInitialize();

        try {
            await this.initPromise;
            this.isInitialized = true;
        } catch (error) {
            this.isInitializing = false;
            this.initPromise = null;
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    private async doInitialize(): Promise<void> {
        try {
            // 设置超时机制
            const initTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Toast UI Editor initialization timeout")), 10000);
            });

            const initEditor = async () => {
                // 动态导入 Toast UI Editor
                const { default: Editor } = await import("@toast-ui/editor");
                await import("@toast-ui/editor/dist/toastui-editor.css");

                // 根据主题加载暗色主题样式
                if (this.isDarkTheme()) {
                    await import("@toast-ui/editor/dist/theme/toastui-editor-dark.css");
                }

                // 创建一个容器用于初始化，使用 CSS 类隐藏
                this.editorContainer = document.createElement('div');
                this.editorContainer.id = 'toast-md-editor';
                this.editorContainer.className = 'markdown-editor-hidden';
                document.body.appendChild(this.editorContainer);

                console.log("Created editor container:", this.editorContainer);

                // 创建编辑器实例
                this.editor = new Editor({
                    el: this.editorContainer,
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

                // 等待编辑器完全初始化
                await new Promise(resolve => setTimeout(resolve, 300));

                console.log("Editor initialized, container info:", {
                    hasContainer: !!this.editorContainer,
                    hasParent: !!this.editorContainer?.parentNode,
                    containerChildren: this.editorContainer?.children.length
                });

                // 保持容器在 body 中，但处于隐藏状态
                // 这样可以随时移动到目标容器
                console.log("Editor container remains in body (hidden state)");
            };

            // 使用 Promise.race 实现超时控制
            await Promise.race([initEditor(), initTimeout]);

        } catch (error) {
            // 清理可能的残留状态
            if (this.editor) {
                try {
                    this.editor.destroy();
                } catch (e) {
                    // 忽略清理错误
                }
                this.editor = null;
            }
            throw error;
        }
    }

    attachToContainer(container: HTMLElement, widget: MarkdownTypeWidget): boolean {
        console.log("Attempting to attach editor to container", {
            hasEditor: !!this.editor,
            isInitialized: this.isInitialized,
            hasEditorContainer: !!this.editorContainer,
            containerTagName: container.tagName
        });

        if (!this.editor || !this.isInitialized) {
            console.log("Editor not ready:", { hasEditor: !!this.editor, isInitialized: this.isInitialized });
            return false;
        }

        if (!this.editorContainer) {
            console.error("Editor container is null");
            return false;
        }

        try {
            if (this.currentContainer && this.currentContainer === container) {
                console.log("old container");
                return true;
            }
            // 如果已经附加到其他容器，先分离
            if (this.currentContainer && this.currentContainer !== container) {
                console.log("Detaching from previous container");
                this.detachFromContainer();
            }

            // 清空目标容器
            container.innerHTML = '';

            // 获取编辑器的 DOM 元素
            const editorElement = this.editorContainer;
            console.log("Editor element info:", {
                exists: !!editorElement,
                hasParent: !!editorElement?.parentNode,
                parentTagName: editorElement?.parentNode?.nodeName
            });

            if (editorElement) {
                // 如果编辑器容器有父节点，先移除
                if (editorElement.parentNode) {
                    editorElement.parentNode.removeChild(editorElement);
                }

                // 切换到显示状态
                editorElement.className = 'markdown-editor-visible';
                this.addEditorHight();

                // 将编辑器移动到新容器
                container.appendChild(editorElement);

                // 更新当前容器和组件引用
                this.currentContainer = container;
                this.currentWidget = widget;

                // 重新绑定事件
                this.bindEvents(widget);

                console.log("Successfully attached editor to container");
                return true;
            } else {
                console.error("Editor element is null");
                return false;
            }
        } catch (error) {
            console.error("Failed to attach editor to container:", error);
            return false;
        }

        return false;
    }

    detachFromContainer(): void {
        if (this.currentWidget) {
            this.unbindEvents();
        }
        if (this.currentContainer && this.editorContainer && this.editorContainer.parentNode === this.currentContainer) {
            // 切换到隐藏状态
            this.editorContainer.className = 'markdown-editor-hidden';

            // 将编辑器移回 body（隐藏状态）
            this.currentContainer.removeChild(this.editorContainer);
            document.body.appendChild(this.editorContainer);
        }
        this.removeEditorHeight();
        this.currentContainer = null;
        this.currentWidget = null;
    }

    private bindEvents(widget: MarkdownTypeWidget): void {
        if (!this.editor) return;

        // 移除之前的事件监听器
        this.editor.off('change');

        // 绑定新的事件监听器
        this.editor.on('change', () => {
            if (widget.isEditorReady && !options.is("databaseReadonly")) {
                widget.saveData();
            }
        });
    }

    private unbindEvents(): void {
        if (!this.editor) return;
        this.editor.off('change');
    }

    getEditor(): Editor | null {
        return this.editor;
    }

    isEditorInitialized(): boolean {
        return this.isInitialized && this.editor !== null;
    }

    setContent(content: string): void {
        if (!this.editor) return;

        try {
            this.editor.setMarkdown(content || "", false);
        } catch (error) {
            console.error("Failed to set editor content:", error);
        }
    }

    getContent(): string {
        if (!this.editor) return "";

        try {
            return this.editor.getMarkdown();
        } catch (error) {
            console.error("Failed to get editor content:", error);
            return "";
        }
    }

    focus(): void {
        if (!this.editor) return;

        try {
            this.editor.focus();
        } catch (error) {
            console.error("Failed to focus editor:", error);
        }
    }

    moveCursorToEnd(): void {
        if (!this.editor) return;

        try {
            this.editor.moveCursorToEnd();
        } catch (error) {
            console.error("Failed to move cursor to end:", error);
        }
    }

    updateReadOnlyMode(isReadOnly: boolean): void {
        // Toast UI Editor 没有直接的只读模式 API，通过 CSS 控制
        if (this.currentContainer) {
            if (isReadOnly) {
                this.currentContainer.classList.add('readonly-mode');
            } else {
                this.currentContainer.classList.remove('readonly-mode');
            }
        }
    }

    private isDarkTheme(): boolean {
        const body = document.body;
        return body.classList.contains("theme-dark") ||
            body.classList.contains("dark") ||
            body.classList.contains("theme-next-dark") ||
            body.getAttribute('data-theme') === 'dark' ||
            getComputedStyle(body).getPropertyValue('--theme-style')?.trim() === 'dark';
    }

    // 全局清理方法（应用关闭时调用）
    destroy(): void {
        this.detachFromContainer();

        if (this.editor) {
            try {
                this.editor.destroy();
            } catch (e) {
                console.warn("Error destroying Toast UI Editor:", e);
            }
            this.editor = null;
        }

        // 清理编辑器容器
        if (this.editorContainer && this.editorContainer.parentNode) {
            this.editorContainer.parentNode.removeChild(this.editorContainer);
        }
        this.editorContainer = null;

        this.isInitialized = false;
        this.isInitializing = false;
        this.initPromise = null;
    }

    private addEditorHight(): void {
        document.querySelector('.note-detail')?.classList.add('note-detail-replace');
    }

    private removeEditorHeight(): void {
        document.querySelector('.note-detail')?.classList.remove('note-detail-replace');
    }

}

const TPL = /*html*/`
<div class="note-detail-markdown note-detail-printable" style="height: 100%">
    <style>
        .note-detail-replace {
            height: 100%;
        }

        .note-detail-markdown {
            height: 100%;
            font-family: var(--detail-font-family);
        }

        .toast-ui-editor-container {
            height: 100%;
            min-height: 300px;
        }

        /* Toast UI Editor 基础样式 */
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
            min-height: 200px !important;
        }

        /* 回退编辑器样式 */
        .fallback-markdown-editor {
            min-height: 200px !important;
        }

        /* 编辑器容器显示/隐藏控制 */
        .markdown-editor-hidden {
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 100px !important;
            height: 100px !important;
            visibility: hidden !important;
            opacity: 0 !important;
        }

        .markdown-editor-visible {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            height: 100% !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    </style>

    <div class="toast-ui-editor-container"></div>
</div>
`;

export default class MarkdownTypeWidget extends TypeWidget {

    private $container!: JQuery<HTMLElement>;
    public isEditorReady = false;
    private isFallbackMode = false;
    private editorManager = MarkdownEditorManager.getInstance();

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



    async doRefresh(note: FNote) {
        if (note.type !== "markdown") {
            return;
        }

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

            // 确保全局编辑器已初始化
            await this.editorManager.initializeEditor();

            // 尝试将编辑器附加到当前容器
            const attached = this.editorManager.attachToContainer(this.$container[0], this);

            if (!attached) {
                throw new Error("Failed to attach editor to container");
            }

            // 设置内容
            this.editorManager.setContent(content);

            // 更新只读模式
            await this.updateReadOnlyMode();

            // 启用自动保存
            setTimeout(() => {
                this.isEditorReady = true;
            }, 100);

        } catch (error) {
            console.log(error);
            this.initializeFallbackEditor(content);
        }
    }

    private initializeFallbackEditor(content: string) {
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
                    justify-content: space-between;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>📝</span>
                        <span>Markdown 编辑器</span>
                        <span style="opacity: 0.7; font-size: 11px;">(简化模式)</span>
                    </div>
                    <div style="font-size: 11px; opacity: 0.6;">
                        支持基本语法 | Tab 键缩进
                    </div>
                </div>
                <textarea
                    class="fallback-markdown-editor"
                    style="
                        flex: 1;
                        min-height: 200px;
                        border: none;
                        outline: none;
                        padding: 16px;
                        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
                        font-size: 14px;
                        line-height: 1.6;
                        background-color: var(--main-background-color);
                        color: var(--main-text-color);
                        resize: vertical;
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
                height: 100%;
                min-height: 200px;
                color: var(--muted-text-color);
                font-size: 14px;
                background: var(--main-background-color);
            ">
                <div style="text-align: center;">
                    <div style="
                        margin-bottom: 15px;
                        font-size: 24px;
                        animation: spin 2s linear infinite;
                    ">⚙️</div>
                    <div style="margin-bottom: 8px; font-weight: 500;">Loading Markdown Editor</div>
                    <div style="font-size: 12px; opacity: 0.7;">Initializing Toast UI Editor...</div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        this.$container.html(loadingHtml);
    }



    getData() {
        if (this.isFallbackMode) {
            const $textarea = this.$container.find('.fallback-markdown-editor');
            const content = $textarea.val() as string;
            return {
                content: content || ""
            };
        }

        const content = this.editorManager.getContent();
        return {
            content: content || ""
        };
    }

    focus() {
        if (this.isFallbackMode) {
            this.$container.find('.fallback-markdown-editor').focus();
        } else {
            this.editorManager.focus();
        }
    }

    scrollToEnd() {
        if (!this.isFallbackMode) {
            // 移动光标到末尾
            this.editorManager.moveCursorToEnd();

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
        } else {
            // 从管理器中分离编辑器（但不销毁）
            this.editorManager.detachFromContainer();
        }

        this.isEditorReady = false;
        this.isFallbackMode = false;
        super.cleanup();
    }

    // 支持主题切换
    async themeChangedEvent() {
        // 使用统一的主题变化处理方法
        await this.handleThemeChange();
    }

    // 导出功能
    exportMarkdown() {
        if (!this.note) {
            return;
        }

        const content = this.editorManager.getContent();
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
        const editor = this.editorManager.getEditor();
        if (!editor || !this.note) {
            return;
        }

        const html = editor.getHTML();
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
        if (this.editorManager.isEditorInitialized()) {
            const isDark = this.isDarkTheme();

            // 更新编辑器主题相关的CSS类
            if (isDark) {
                this.$container.addClass('dark-theme');
                this.$container.removeClass('light-theme');
            } else {
                this.$container.addClass('light-theme');
                this.$container.removeClass('dark-theme');
            }
        }
    }

    // 更新只读模式
    async updateReadOnlyMode() {
        if (!this.noteContext) {
            return;
        }

        try {
            const isReadOnly = await this.noteContext.isReadOnly();

            if (!this.isFallbackMode) {
                this.editorManager.updateReadOnlyMode(isReadOnly);

                // 额外的 CSS 控制
                if (isReadOnly) {
                    this.$container.find('.toastui-editor-toolbar').css('pointer-events', 'none');
                    this.$container.find('.toastui-editor-md-container').css('pointer-events', 'none');
                    this.$container.find('.CodeMirror').css('pointer-events', 'none');
                    this.$container.find('.toastui-editor').addClass('readonly');
                } else {
                    this.$container.find('.toastui-editor-toolbar').css('pointer-events', 'auto');
                    this.$container.find('.toastui-editor-md-container').css('pointer-events', 'auto');
                    this.$container.find('.CodeMirror').css('pointer-events', 'auto');
                    this.$container.find('.toastui-editor').removeClass('readonly');
                }
            }
        } catch (error) {
            // 忽略只读模式更新错误
        }
    }


}

// 导出全局初始化和清理函数
export const initializeMarkdownEditor = async (): Promise<void> => {
    try {
        const manager = MarkdownEditorManager.getInstance();
        await manager.initializeEditor();
    } catch (error) {
        console.warn("Failed to initialize global markdown editor:", error);
        // 不抛出错误，允许回退到简化编辑器
    }
};

export const destroyMarkdownEditor = (): void => {
    try {
        const manager = MarkdownEditorManager.getInstance();
        manager.destroy();
    } catch (error) {
        console.warn("Failed to destroy global markdown editor:", error);
    }
};
