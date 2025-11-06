# Markdown 编辑器迁移：从 Vditor 到 Toast UI Editor

## 🎯 迁移原因

Toast UI Editor 相比 Vditor 具有以下优势：

### ✅ **用户体验优势**
- **更直观的界面设计**：Toast UI Editor 有更现代化和用户友好的界面
- **更好的响应性**：在大文档编辑时性能更稳定
- **更丰富的工具栏**：提供更多实用的编辑工具
- **更好的预览体验**：支持垂直分屏和标签页预览模式

### ✅ **技术优势**
- **更稳定的 API**：API 设计更合理，文档更完善
- **更好的主题支持**：内置亮色/暗色主题，切换更流畅
- **更强的扩展性**：插件系统更完善
- **更好的维护**：由 NHN 公司维护，更新更及时

## 🔄 主要变化

### **依赖变化**
```diff
- "vditor": "^3.10.4"
+ "@toast-ui/editor": "^3.2.2"
```

### **API 变化对比**

| 功能 | Vditor | Toast UI Editor |
|------|--------|-----------------|
| 初始化 | `new Vditor(el, options)` | `new Editor(options)` |
| 获取内容 | `getValue()` | `getMarkdown()` |
| 设置内容 | `setValue(content)` | `setMarkdown(content)` |
| 获取HTML | `getHTML()` | `getHTML()` |
| 聚焦 | `focus()` | `focus()` |
| 销毁 | `destroy()` | `destroy()` |
| 主题 | `theme: "dark"/"classic"` | `theme: "dark"/"light"` |

### **配置变化**

#### Vditor 配置
```typescript
new Vditor(container, {
    height: "100%",
    mode: "sv",
    theme: "dark",
    toolbar: [...],
    input: (value) => { /* 保存逻辑 */ }
});
```

#### Toast UI Editor 配置
```typescript
new Editor({
    el: container,
    height: "100%",
    initialEditType: "markdown",
    previewStyle: "vertical",
    theme: "dark",
    toolbarItems: [...],
    events: {
        change: () => { /* 保存逻辑 */ }
    }
});
```

## 🎨 样式变化

### **CSS 类名变化**
```diff
- .vditor-container → .toast-ui-editor-container
- .vditor-toolbar → .toastui-editor-toolbar
- .vditor-content → .toastui-editor-md-container
- .vditor-preview → .toastui-editor-md-preview
```

### **主题适配**
Toast UI Editor 提供了更好的主题支持：
- 内置 `light` 和 `dark` 主题
- 更好的 CSS 变量集成
- 自动适配 Trilium 的主题系统

## 🚀 新功能特性

### **1. 更好的编辑模式**
- **Markdown 模式**：纯 Markdown 编辑
- **WYSIWYG 模式**：所见即所得编辑
- **混合模式**：可以在两种模式间切换

### **2. 增强的工具栏**
```typescript
toolbarItems: [
    ["heading", "bold", "italic", "strike"],
    ["hr", "quote"],
    ["ul", "ol", "task", "indent", "outdent"],
    ["table", "image", "link"],
    ["code", "codeblock"],
    ["scrollSync"]
]
```

### **3. 更好的图片处理**
```typescript
hooks: {
    addImageBlobHook: (blob, callback) => {
        // 集成 Trilium 的图片上传功能
        const reader = new FileReader();
        reader.onload = (e) => {
            callback(e.target.result, "image");
        };
        reader.readAsDataURL(blob);
    }
}
```

### **4. 增强的键盘快捷键**
- `Ctrl+B` - 粗体
- `Ctrl+I` - 斜体
- `Ctrl+K` - 链接
- `Ctrl+Shift+C` - 代码块
- `Ctrl+Shift+I` - 图片

## 🔧 迁移步骤

### **1. 更新依赖**
```bash
cd apps/client
pnpm remove vditor
pnpm add @toast-ui/editor@^3.2.2
```

### **2. 更新代码**
- ✅ 更新 `markdown.ts` 使用新的 API
- ✅ 更新类型定义文件
- ✅ 更新测试文件
- ✅ 更新样式文件

### **3. 测试功能**
- ✅ 创建 markdown 笔记
- ✅ 编辑和保存功能
- ✅ 主题切换
- ✅ 导出功能
- ✅ 只读模式

## 📋 兼容性保证

### **保持的功能**
- ✅ 所有原有的编辑功能
- ✅ 自动保存机制
- ✅ 主题自动适配
- ✅ 导出 Markdown/HTML
- ✅ 只读模式支持
- ✅ 与 Trilium 的完整集成

### **改进的功能**
- 🚀 更好的用户界面
- 🚀 更稳定的性能
- 🚀 更丰富的编辑工具
- 🚀 更好的主题支持
- 🚀 更强的扩展性

## 🎉 总结

Toast UI Editor 的迁移带来了：

1. **更好的用户体验** - 现代化的界面和更直观的操作
2. **更稳定的性能** - 在处理大文档时更流畅
3. **更丰富的功能** - 更多的编辑工具和选项
4. **更好的维护性** - 更稳定的 API 和更好的文档
5. **完全的向后兼容** - 保持所有原有功能不变

这次迁移让 Trilium 的 Markdown 编辑体验更上一层楼！🎊