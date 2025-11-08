# Markdown 只读预览实现

## 问题描述
当 Markdown 笔记作为子文档显示在卡片中时，应该显示渲染后的预览而不是编辑器。

## 解决方案

### 1. 创建只读 Markdown Widget
创建了 `read_only_markdown.ts` 文件，实现只读预览功能。

### 2. 使用 Toast UI Editor Viewer
Toast UI Editor 提供了专门的 Viewer 组件用于只读渲染：

```typescript
import { default: Viewer } from "@toast-ui/editor/dist/toastui-editor-viewer";
import "@toast-ui/editor/dist/toastui-editor-viewer.css";

this.viewer = new Viewer({
    el: this.$content[0],
    initialValue: markdownContent,
    usageStatistics: false
});
```

### 3. 特性
- **完整的 Markdown 渲染**：支持所有标准 Markdown 语法
- **代码高亮**：自动语法高亮
- **表格支持**：完整的表格渲染
- **图片显示**：自动显示图片
- **主题适配**：自动适配 Trilium 主题
- **轻量级**：比完整编辑器更轻量

### 4. 回退机制
如果 Toast UI Viewer 加载失败，会回退到简单的 HTML 显示：

```typescript
this.$content.html(`<pre style="white-space: pre-wrap;">${escapeHtml(content)}</pre>`);
```

## 集成方式

### 注册 Widget
需要在 Trilium 的 widget 注册系统中添加这个新的 widget 类型。

通常在类似 `widget_factory.ts` 或 `type_widget_registry.ts` 的文件中：

```typescript
import ReadOnlyMarkdownTypeWidget from "./type_widgets/read_only_markdown.js";

// 注册 widget
registerWidget("readOnlyMarkdown", ReadOnlyMarkdownTypeWidget);
```

### 使用场景
- 子文档卡片预览
- 只读笔记显示
- 搜索结果预览
- 笔记引用预览

## 与编辑模式的区别

### 编辑模式 (markdown.ts)
- 使用 Toast UI Editor
- 支持编辑和实时预览
- 工具栏和编辑功能
- 自动保存

### 只读模式 (read_only_markdown.ts)
- 使用 Toast UI Viewer
- 只显示渲染结果
- 无编辑功能
- 轻量级渲染

## 样式特点

### 响应式设计
- 自适应容器宽度
- 图片自动缩放
- 表格响应式布局

### 主题集成
- 使用 Trilium CSS 变量
- 自动适配暗色/亮色主题
- 一致的视觉风格

### 排版优化
- 合适的行高和间距
- 清晰的标题层级
- 优雅的代码块样式

## 性能优势

### 相比完整编辑器
- **更快的加载速度**：Viewer 比 Editor 更轻量
- **更少的内存占用**：无需编辑功能的开销
- **更好的渲染性能**：专注于显示优化

### 资源管理
- **按需加载**：只在需要时加载 Viewer
- **正确清理**：组件销毁时清理 Viewer 实例
- **无内存泄漏**：完整的生命周期管理

## 下一步

### 需要完成的工作
1. 在 widget 注册系统中注册 `ReadOnlyMarkdownTypeWidget`
2. 配置路由规则，让子文档使用只读模式
3. 测试预览功能是否正常工作
4. 确保主题切换时预览正确更新

### 可选增强
- 添加"编辑"按钮切换到编辑模式
- 支持目录导航
- 添加打印样式优化
- 支持导出功能

这个只读预览实现为 Markdown 笔记提供了完整的预览功能，同时保持了轻量级和高性能的特点。