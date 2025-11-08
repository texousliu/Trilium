# Markdown 预览修复 - 变更说明

## 问题
1. Markdown 笔记在子文档卡片中只显示 "M1" 图标，没有显示渲染后的内容
2. Markdown 笔记开启分享后在分享链接中无法查看

## 根本原因
1. **客户端**：`content_renderer.ts` 的 `getRenderedContent()` 函数没有处理 `markdown` 类型
2. **服务端分享**：`share/content_renderer.ts` 的 `getContent()` 函数没有处理 `markdown` 类型

---

## 修改的文件

### 1. `apps/client/src/services/content_renderer.ts`

#### 修改 1：在 `getRenderedContent()` 中添加 markdown 处理分支

**位置**：第 52 行附近

```typescript
// 添加这一行
} else if (type === "markdown") {
    await renderMarkdown(entity, $renderedContent);
```

#### 修改 2：添加 `renderMarkdown()` 函数

**位置**：`renderCode()` 函数之后（第 168-195 行）

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

---

### 2. `apps/server/src/share/content_renderer.ts` （分享功能）

#### 修改 1：添加 markdown service 导入

**位置**：文件顶部导入区域

```typescript
import markdownService from "../services/import/markdown.js";
```

#### 修改 2：在 `getContent()` 中添加 markdown 处理分支

**位置**：第 256 行附近

```typescript
} else if (note.type === "markdown") {
    renderMarkdown(result);
```

#### 修改 3：添加 `renderMarkdown()` 函数

**位置**：`renderCode()` 函数之后（第 398-408 行）

```typescript
/**
 * Renders a markdown note by converting it to HTML.
 */
function renderMarkdown(result: Result) {
    if (typeof result.content !== "string" || !result.content?.trim()) {
        result.isEmpty = true;
    } else {
        // Convert markdown to HTML using the markdown service
        result.content = markdownService.renderToHtml(result.content, "");
        result.isEmpty = false;
    }
}
```

---

### 3. `apps/client/src/components/note_context.ts`

#### 修改 1：扩展 `isReadOnly()` 支持 markdown 类型

**位置**：第 257 行

```typescript
// 修改前
if (!this.note || (this.note.type !== "text" && this.note.type !== "code")) {

// 修改后
if (!this.note || (this.note.type !== "text" && this.note.type !== "code" && this.note.type !== "markdown")) {
```

#### 修改 2：为 markdown 添加大小限制逻辑

**位置**：第 288-291 行

```typescript
// 修改前
const sizeLimit = this.note.type === "text"
    ? options.getInt("autoReadonlySizeText")
    : options.getInt("autoReadonlySizeCode");

// 修改后
const sizeLimit = this.note.type === "text"
    ? options.getInt("autoReadonlySizeText")
    : this.note.type === "markdown"
    ? options.getInt("autoReadonlySizeText") // Use text size limit for markdown
    : options.getInt("autoReadonlySizeCode");
```

---

## 修复效果

修复后，Markdown 笔记会在以下场景正确显示预览：

### 客户端
1. ✅ **子文档卡片** - 显示渲染后的 Markdown 内容
2. ✅ **笔记引用** - 在其他笔记中引用时显示预览
3. ✅ **搜索结果** - 搜索结果中的预览
4. ✅ **工具提示** - 鼠标悬停时的预览

### 分享功能
5. ✅ **分享链接** - Markdown 笔记在分享链接中正确显示为 HTML

---

## 测试步骤

1. 重新编译客户端代码
2. 强制刷新浏览器（Ctrl+Shift+R）
3. 创建一个 Markdown 笔记，添加一些内容
4. 在另一个笔记中引用该 Markdown 笔记
5. 验证子文档卡片显示渲染后的内容

---

## 技术说明

### 客户端渲染
- 使用 **Toast UI Viewer** 渲染 Markdown
- 支持完整的 Markdown 语法（标题、列表、代码块、表格等）
- 提供回退机制：如果 Viewer 加载失败，显示格式化的纯文本
- 按需动态加载，不影响其他功能的性能

### 服务端渲染（分享）
- 使用 **marked** 库（通过 `markdownService.renderToHtml()`）
- 将 Markdown 转换为 HTML 后发送给浏览器
- 支持完整的 Markdown 语法和扩展功能
- 与导入/导出功能使用相同的渲染逻辑，保证一致性
