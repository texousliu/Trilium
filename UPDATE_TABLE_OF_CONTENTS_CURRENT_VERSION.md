# 当前版本 updateTableOfContents 实现

```typescript
// Extract headings from markdown content
const extractHeadings = (markdown: string) => {
    const headings: Array<{ id: string; level: number; text: string; lineIndex: number }> = [];
    const lines = markdown.split('\n');
    const headingRegex = /^(#{1,6})\s+(.*)$/;

    lines.forEach((line, index) => {
        const match = line.match(headingRegex);
        if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = `heading-${index}-${Date.now()}`;
            headings.push({ id, level, text, lineIndex: index });
        }
    });

    return headings;
};

// Update TOC in context
const updateTableOfContents = (content: string) => {
    const headings = extractHeadings(content);

    if (noteContext) {
        noteContext.setContextData("toc", {
            headings,
            scrollToHeading: (targetHeading: { id: string; level: number; text: string; lineIndex: number }) => {
                if (!editorRef.current) return;

                try {
                    const editor = editorRef.current;

                    // Define different line heights for different content types based on toastui-editor.css
                    const lineHeights = editor.isWysiwygMode() ? {
                        content: 20.8,  // Regular content line height: 13px * 160% = 20.8px
                        h1: 28,         // Heading 1 line height from CSS
                        h2: 23,         // Heading 2 line height from CSS
                        h3: 18,         // Heading 3 line height from CSS
                        h4: 18,         // Heading 4 line height from CSS
                        h5: 17,         // Heading 5 line height from CSS
                        h6: 17          // Heading 6 line height from CSS
                    } : {
                        content: 19.5, // Regular content line height
                        h1: 36,      // Heading 1 line height
                        h2: 33,      // Heading 2 line height
                        h3: 30,      // Heading 3 line height
                        h4: 27,      // Heading 4 line height
                        h5: 24,      // Heading 5 line height
                        h6: 21       // Heading 6 line height
                    };

                    // Get the current content
                    const content = editor.getMarkdown();
                    const lines = content.split('\n');
                    let scrollPosition = 0;

                    // Iterate through all lines up to the target heading's line index
                    for (let i = 0; i < targetHeading.lineIndex; i++) {
                        const line = lines[i];
                        const match = line.match(/^\s*(#{1,6})\s+(.*)$/);

                        if (match) {
                            // This is a heading, use heading line height
                            const headingLevel = match[1].length;
                            const headingType = `h${headingLevel}` as keyof typeof lineHeights;
                            scrollPosition += lineHeights[headingType];
                            if (i === 0 && headingLevel === 1) {
                                scrollPosition -= 38;
                            }
                        } else {
                            // This is regular content, use content line height
                            scrollPosition += lineHeights.content;
                        }
                    }

                    // Apply the calculated scroll position
                    editor.setScrollTop(scrollPosition);
                } catch (error) {
                    console.error("Error scrolling to heading:", error);
                }
            }
        });
    }
};
```

## 功能说明

1. **标题提取**：
   - 使用 `extractHeadings` 函数从markdown内容中提取标题
   - 为每个标题添加 `lineIndex` 属性，记录其在文件中的准确位置
   - 解决了多个相同标题的定位问题

2. **TOC上下文设置**：通过 `noteContext.setContextData` 设置TOC数据

3. **模式感知的差异化行高**：
   - 根据编辑器模式（WYSIWYG/非WYSIWYG）使用不同的行高配置
   - WYSIWYG模式：更精确的小数行高（如content: 20.797px）
   - 非WYSIWYG模式：整数行高配置
   - 为不同级别标题（h1-h6）和普通内容定义不同行高

4. **基于行索引的精确滚动定位**：
   - 使用标题的 `lineIndex` 属性进行精确定位
   - 遍历所有行到目标标题位置，累积计算滚动位置
   - 根据内容类型（标题/普通内容）应用不同行高
   - 针对第一行h1标题添加特殊偏移处理
   - 使用 Toast UI Editor 的 `setScrollTop` 方法直接定位

5. **精确的标题匹配**：使用正则表达式 `/^\s*(#{1,6})\s+(.*)$/` 匹配标题

6. **错误处理**：完整的 try-catch 块包装，确保稳定运行

## 后续微调建议

1. 可添加滚动动画效果
2. 可优化标题匹配算法，支持更复杂的标题格式
3. 可考虑添加当前标题高亮功能
4. 可优化移动端体验
5. 可根据实际编辑器渲染效果调整行高值
6. 可考虑添加对不同编辑器模式（编辑/预览）的行高适配

## 注意事项

- 此版本已实现基本功能，后续修改请基于此版本进行
- 保持函数签名不变
- 保持多级fallback机制
- 确保兼容性和稳定性