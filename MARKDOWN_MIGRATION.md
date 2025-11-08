# Markdown 文件迁移

## 问题
升级后，旧的 `text/markdown` 文件被识别成 `file` 类型，而不是 `markdown` 类型。

## 原因
在旧版本中，Markdown 文件是作为 `type='file'` 和 `mime='text/markdown'` 存储的。新版本引入了专门的 `markdown` 笔记类型，但没有自动迁移旧数据。

## 解决方案

创建了数据库迁移脚本来自动转换旧的 Markdown 文件。

### 修改的文件

#### 1. `apps/server/src/migrations/0234__migrate_markdown_files_to_markdown_type.ts`（新文件）

这个迁移脚本会：
- 查找所有 `type='file'` 且 `mime` 为 `text/markdown`、`text/x-markdown` 或 `text/mdx` 的笔记
- 将它们的 `type` 更新为 `markdown`
- 将它们的 `mime` 更新为 `text/html`
- 同时更新这些笔记的所有历史版本

```typescript
export default function migrate() {
    // Find all notes that are markdown files
    const markdownFiles = sql.getRows<MarkdownFileRow>(`
        SELECT noteId, title, mime
        FROM notes
        WHERE type = 'file' 
        AND (mime = 'text/markdown' OR mime = 'text/x-markdown' OR mime = 'text/mdx')
        AND isDeleted = 0
    `);

    for (const note of markdownFiles) {
        // Update the note type to 'markdown' and mime to 'text/html'
        sql.execute(`
            UPDATE notes 
            SET type = 'markdown', 
                mime = 'text/html'
            WHERE noteId = ?
        `, [note.noteId]);

        // Also update any revisions of this note
        sql.execute(`
            UPDATE revisions 
            SET type = 'markdown',
                mime = 'text/html'
            WHERE noteId = ?
        `, [note.noteId]);
    }
}
```

#### 2. `apps/server/src/migrations/migrations.ts`

添加新的迁移到迁移列表：

```typescript
const MIGRATIONS: (SqlMigration | JsMigration)[] = [
    // Migrate old text/markdown files to markdown note type
    {
        version: 234,
        module: async () => import("./0234__migrate_markdown_files_to_markdown_type.js")
    },
    // ... 其他迁移
];
```

#### 3. `apps/server/src/services/app_info.ts`

更新数据库版本号：

```typescript
const APP_DB_VERSION = 234; // 从 233 更新到 234
```

## 迁移过程

1. **自动执行**：当服务器启动时，如果检测到数据库版本低于 234，会自动执行迁移
2. **备份**：迁移前会自动创建数据库备份
3. **事务性**：所有迁移在一个事务中执行，要么全部成功，要么全部回滚
4. **日志**：迁移过程会记录详细日志

## 迁移后的效果

- ✅ 所有旧的 Markdown 文件会被转换为 `markdown` 类型
- ✅ 可以使用 Markdown 编辑器编辑
- ✅ 子文档卡片中正确显示预览
- ✅ 分享链接中正确显示
- ✅ 历史版本也会被正确迁移

## 测试

重启服务器后，检查日志：

```
Starting migration: Converting text/markdown files to markdown note type
Found X markdown files to migrate
Migrated markdown file: [文件名] ([noteId])
...
Successfully migrated X markdown files to markdown note type
Migration to version 234 has been successful.
```

## 注意事项

- 迁移是不可逆的（但有备份）
- 迁移只影响 `type='file'` 且 MIME 类型为 markdown 的笔记
- 已删除的笔记不会被迁移
- 迁移会同时更新笔记和它的所有历史版本
