# Markdown 预览问题修复

## 问题描述
Markdown 笔记在子文档卡片中没有显示预览，而是显示 "M1" 图标。

## 根本原因

问题有两个层面：

### 1. `isReadOnly()` 方法不支持 markdown 类型
在 `apps/client/src/components/note_context.ts` 的 `isReadOnly()` 方法中，只读状态检查仅支持 `text` 和 `code` 类型的笔记：

```typescript
// 原代码（有问题）
if (!this.note || (this.note.type !== "text" && this.note.type !== "code")) {
    return false;
}
```

### 2. `content_renderer.ts` 没有处理 markdown 类型
更重要的是，在 `apps/client/src/services/content_renderer.ts` 中，`getRenderedContent()` 函数没有处理 `markdown` 类型的笔记。当遇到 markdown 类型时，它会走到 else 分支，只显示图标而不是渲染内容。

这是子文档卡片显示图标的直接原因，因为子文档使用 `content_renderer.getRenderedContent()` 来渲染内容。

## 修复方案

### 1. 修改 `content_renderer.ts` 添加 markdown 渲染支持（关键修复）

**文件**: `apps/client/src/services/content_renderer.ts`

**修改 1**: 在 `getRenderedContent()` 函数中添加 markdown 类型处理
```typescript
if (type === "text" || type === "book") {
    await renderText(entity, $renderedContent, options);
} else if (type === "code") {
    await renderCode(entity, $renderedContent);
} else if (type === "markdown") {
    await renderMarkdown(entity, $renderedContent);  // 新增
} else if (["image", "canvas", "mindMap"].includes(type)) {
    renderImage(entity, $renderedContent, options);
}
```

**修改 2**: 添加 `renderMarkdown()` 函数
```typescript
/**
 * Renders a markdown note using Toast UI Viewer
 */
async function renderMarkdown(note: FNote | FAttachment, $renderedContent: JQuery<HTMLElement>) {
    const blob = await note.getBlob();
    const content = blob?.content || "";

    try {
        // Dynamically import Toast UI Viewer
        const { default: Viewer } = await import("@toast-ui/editor/dist/toastui-editor-viewer");
        await import("@toast-ui/editor/dist/toastui-editor-viewer.css");

        // Create a container for the viewer
        const $viewerContainer = $('<div class="markdown-viewer-container"></div>');
        $renderedContent.append($viewerContainer);

        // Initialize the viewer
        new Viewer({
            el: $viewerContainer[0],
            initialValue: content,
            usageStatistics: false
        });
    } catch (error) {
        console.error("Failed to render markdown with Toast UI Viewer:", error);
        // Fallback to plain text display
        const $pre = $("<pre>").css({
            "white-space": "pre-wrap",
            "word-wrap": "break-word",
            "padding": "10px"
        });
        $pre.text(content);
        $renderedContent.append($pre);
    }
}
```

### 2. 修改 `isReadOnly()` 方法支持 markdown 类型（可选，用于完整的只读模式支持）

**文件**: `apps/client/src/components/note_context.ts`

**修改 1**: 添加 markdown 类型到只读检查
```typescript
// 修复后
if (!this.note || (this.note.type !== "text" && this.note.type !== "code" && this.note.type !== "markdown")) {
    return false;
}
```

**修改 2**: 为 markdown 添加大小限制逻辑
```typescript
const sizeLimit = this.note.type === "text"
    ? options.getInt("autoReadonlySizeText")
    : this.note.type === "markdown"
    ? options.getInt("autoReadonlySizeText") // 使用 text 的大小限制
    : options.getInt("autoReadonlySizeCode");
```

## 修复效果

修复后，Markdown 笔记会在以下场景正确显示预览：

1. **子文档卡片**: Markdown 笔记作为子文档显示时，会显示渲染后的预览（这是最主要的修复）
2. **笔记引用**: 在其他笔记中引用 Markdown 笔记时，会显示预览
3. **搜索结果**: 搜索结果中的 Markdown 笔记预览
4. **工具提示**: 鼠标悬停在 Markdown 笔记链接上时的预览
5. **只读笔记**: 设置了 `readOnly` 标签的 Markdown 笔记会使用专门的只读 widget

## 测试步骤

1. 重新编译客户端代码
2. 创建一个 Markdown 笔记
3. 在另一个笔记中将该 Markdown 笔记作为子文档引用
4. 验证子文档卡片显示的是渲染后的 Markdown 预览，而不是 "M1" 图标

## 相关文件

- `apps/client/src/services/content_renderer.ts` - **关键修复**：添加 markdown 渲染支持
- `apps/client/src/components/note_context.ts` - 修复 isReadOnly 方法支持 markdown
- `apps/client/src/widgets/note_detail.ts` - Widget 类型选择逻辑
- `apps/client/src/widgets/type_widgets/read_only_markdown.ts` - 只读 Markdown Widget
- `apps/client/src/widgets/type_widgets/markdown.ts` - 可编辑 Markdown Widget
- `apps/client/src/widgets/type_widgets/abstract_text_type_widget.ts` - 子文档加载逻辑

## 注意事项

- 修复后需要重新编译客户端代码
- 如果浏览器有缓存，可能需要强制刷新（Ctrl+Shift+R）
- 确保 Toast UI Editor Viewer 库已正确安装
