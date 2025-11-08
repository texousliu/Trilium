# Markdown 预览问题解决方案

## 问题分析

经过深度排查，发现 Markdown 笔记在子文档卡片中只显示图标的根本原因是：

**`content_renderer.ts` 没有处理 `markdown` 类型的笔记**

子文档卡片使用 `content_renderer.getRenderedContent()` 来渲染内容，但这个函数只处理了以下类型：
- `text` / `book`
- `code`
- `image` / `canvas` / `mindMap`
- `file` / `pdf` / `audio` / `video`
- `mermaid`
- `render`
- `doc`

当遇到 `markdown` 类型时，会走到 else 分支，只显示笔记图标。

## 修复内容

### 主要修复：`apps/client/src/services/content_renderer.ts`

1. **在 `getRenderedContent()` 中添加 markdown 处理**
   ```typescript
   } else if (type === "markdown") {
       await renderMarkdown(entity, $renderedContent);
   ```

2. **添加 `renderMarkdown()` 函数**
   - 使用 Toast UI Viewer 渲染 Markdown 内容
   - 提供回退机制：如果 Viewer 加载失败，显示纯文本
   - 支持完整的 Markdown 语法（标题、列表、代码块、表格等）

### 辅助修复：`apps/client/src/components/note_context.ts`

1. **扩展 `isReadOnly()` 支持 markdown 类型**
   - 允许 markdown 笔记被识别为只读
   - 为 markdown 添加大小限制逻辑

这个修复是为了支持完整的只读模式功能，但对子文档预览不是必需的。

## 工作原理

### 子文档渲染流程

```
用户在笔记中引用 Markdown 子文档
    ↓
abstract_text_type_widget.ts 调用 loadIncludedNote()
    ↓
调用 content_renderer.getRenderedContent(note)
    ↓
检测到 type === "markdown"
    ↓
调用 renderMarkdown() 函数
    ↓
使用 Toast UI Viewer 渲染 Markdown 内容
    ↓
显示渲染后的预览（而不是图标）
```

### 只读模式流程（可选）

```
用户打开 Markdown 笔记
    ↓
note_detail.ts 调用 getWidgetType()
    ↓
检查 isReadOnly() 是否返回 true
    ↓
如果是只读，使用 ReadOnlyMarkdownTypeWidget
    ↓
如果可编辑，使用 MarkdownTypeWidget
```

## 测试验证

### 测试步骤
1. 重新编译客户端代码
2. 创建一个 Markdown 笔记，添加一些内容（标题、列表、代码块等）
3. 在另一个笔记中引用该 Markdown 笔记作为子文档
4. 验证子文档卡片显示的是渲染后的 Markdown 内容

### 预期结果
- ✅ 子文档卡片显示渲染后的 Markdown 内容
- ✅ 标题、列表、代码块等格式正确显示
- ✅ 图片、链接等元素正常工作
- ✅ 主题切换时预览正确更新

## 技术细节

### Toast UI Viewer
- 轻量级的 Markdown 渲染器
- 支持完整的 Markdown 语法
- 自动语法高亮
- 支持表格、任务列表等扩展语法

### 回退机制
如果 Toast UI Viewer 加载失败，会显示格式化的纯文本：
```typescript
const $pre = $("<pre>").css({
    "white-space": "pre-wrap",
    "word-wrap": "break-word",
    "padding": "10px"
});
$pre.text(content);
```

### 性能考虑
- 按需加载：Toast UI Viewer 只在需要时动态导入
- 轻量级：Viewer 比完整的 Editor 更小更快
- 缓存友好：渲染结果可以被浏览器缓存

## 与其他功能的关系

### 与编辑模式的区别
- **编辑模式** (`MarkdownTypeWidget`): 使用 Toast UI Editor，支持编辑
- **预览模式** (`content_renderer`): 使用 Toast UI Viewer，只读显示
- **只读模式** (`ReadOnlyMarkdownTypeWidget`): 专门的只读 widget

### 与其他笔记类型的一致性
修复后，Markdown 笔记的子文档预览行为与其他类型一致：
- `text` 笔记 → 显示 HTML 内容
- `code` 笔记 → 显示语法高亮的代码
- `markdown` 笔记 → 显示渲染后的 Markdown（修复后）
- `image` 笔记 → 显示图片
- `mermaid` 笔记 → 显示图表

## 总结

这次修复的关键是在 `content_renderer.ts` 中添加了对 `markdown` 类型的支持。这是一个系统级的修复，不仅解决了子文档预览的问题，还为所有使用 `content_renderer` 的地方（搜索结果、工具提示等）提供了 Markdown 预览支持。

修复后，Markdown 笔记在 Trilium 中的体验将更加完整和一致。
