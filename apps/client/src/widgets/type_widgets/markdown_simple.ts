import TypeWidget from "./type_widget.js";
import type FNote from "../../entities/fnote.js";
import SpacedUpdate from "../../services/spaced_update.js";
import protectedSessionHolder from "../../services/protected_session_holder.js";
import server from "../../services/server.js";
import options from "../../services/options.js";

const TPL = /*html*/`
<div class="note-detail-markdown note-detail-printable" style="height: 100%">
    <style>
        .note-detail-markdown {
            height: 100%;
            font-family: var(--detail-font-family);
            padding: 20px;
        }

        .markdown-editor {
            width: 100%;
            height: 100%;
            border: 1px solid var(--main-border-color);
            padding: 10px;
            font-family: 'Courier New', monospace;
            background-color: var(--main-background-color);
            color: var(--main-text-color);
            resize: none;
        }

        .markdown-preview {
            width: 100%;
            height: 100%;
            padding: 10px;
            border: 1px solid var(--main-border-color);
            background-color: var(--main-background-color);
            color: var(--main-text-color);
            overflow-y: auto;
        }

        .markdown-toolbar {
            margin-bottom: 10px;
            padding: 5px;
            background-color: var(--accented-background-color);
            border: 1px solid var(--main-border-color);
        }

        .markdown-toolbar button {
            margin-right: 5px;
            padding: 5px 10px;
            background-color: var(--button-background-color);
            color: var(--button-text-color);
            border: 1px solid var(--main-border-color);
            cursor: pointer;
        }

        .markdown-toolbar button:hover {
            background-color: var(--button-background-color-hover);
        }

        .markdown-container {
            height: calc(100% - 50px);
            display: flex;
        }

        .markdown-editor-pane,
        .markdown-preview-pane {
            flex: 1;
            margin: 0 5px;
        }

        .markdown-mode-edit .markdown-preview-pane {
            display: none;
        }

        .markdown-mode-preview .markdown-editor-pane {
            display: none;
        }
    </style>

    <div class="markdown-toolbar">
        <button class="markdown-btn-edit">Edit</button>
        <button class="markdown-btn-preview">Preview</button>
        <button class="markdown-btn-both">Both</button>
        <span style="margin-left: 20px;">Simple Markdown Editor</span>
    </div>

    <div class="markdown-container">
        <div class="markdown-editor-pane">
            <textarea class="markdown-editor" placeholder="Enter your markdown here..."></textarea>
        </div>
        <div class="markdown-preview-pane">
            <div class="markdown-preview"></div>
        </div>
    </div>
</div>
`;

export default class SimpleMarkdownTypeWidget extends TypeWidget {

    private $editor!: JQuery<HTMLTextAreaElement>;
    private $preview!: JQuery<HTMLElement>;
    private $container!: JQuery<HTMLElement>;
    private currentNoteId?: string;
    private mode: 'edit' | 'preview' | 'both' = 'both';

    constructor() {
        super();

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
        this.$container = this.$widget.find(".markdown-container");
        this.$editor = this.$widget.find(".markdown-editor") as JQuery<HTMLTextAreaElement>;
        this.$preview = this.$widget.find(".markdown-preview");

        // 绑定事件
        this.$editor.on('input', () => {
            if (!options.is("databaseReadonly")) {
                this.updatePreview();
                this.saveData();
            }
        });

        // 工具栏按钮事件
        this.$widget.find(".markdown-btn-edit").on('click', () => this.setMode('edit'));
        this.$widget.find(".markdown-btn-preview").on('click', () => this.setMode('preview'));
        this.$widget.find(".markdown-btn-both").on('click', () => this.setMode('both'));

        super.doRender();
        return this.$widget;
    }

    async doRefresh(note: FNote) {
        if (note.type !== "markdown") {
            return;
        }

        const noteChanged = this.currentNoteId !== note.noteId;
        this.currentNoteId = note.noteId;

        const blob = await note.getBlob();
        const content = blob?.content || "";

        // 设置编辑器内容
        this.$editor.val(content);

        // 更新预览
        this.updatePreview();

        // 检查只读模式
        const isReadOnly = await this.noteContext?.isReadOnly();
        this.$editor.prop('readonly', isReadOnly);
    }

    getData() {
        const content = this.$editor.val() as string || "";
        return {
            content: content
        };
    }

    focus() {
        this.$editor.focus();
    }

    scrollToEnd() {
        const editor = this.$editor[0];
        if (editor) {
            editor.scrollTop = editor.scrollHeight;
            editor.setSelectionRange(editor.value.length, editor.value.length);
        }
    }

    saveData() {
        if (options.is("databaseReadonly")) {
            return;
        }

        this.spacedUpdate.resetUpdateTimer();
        this.spacedUpdate.scheduleUpdate();
    }

    private setMode(mode: 'edit' | 'preview' | 'both') {
        this.mode = mode;
        this.$widget.removeClass('markdown-mode-edit markdown-mode-preview markdown-mode-both');
        this.$widget.addClass(`markdown-mode-${mode}`);
    }

    private updatePreview() {
        const content = this.$editor.val() as string || "";

        // 简单的Markdown渲染（可以后续替换为更完整的渲染器）
        let html = content
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/!\[([^\]]*)\]\(([^\)]*)\)/gim, '<img alt="$1" src="$2" />')
            .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
            .replace(/\n$/gim, '<br />');

        this.$preview.html(html);
    }

    cleanup() {
        this.currentNoteId = undefined;
        super.cleanup();
    }
}
