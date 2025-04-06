# Text
Trilium utilizes the powerful [CKEditor 5](https://ckeditor.com/ckeditor-5/) as its text editing component.

## Formatting Options

The Trilium text note interface does not display toolbars or formatting options by default. These can be accessed by:

![inline note formatting](1_Text_text-notes-formatting.png)

1.  Selecting text to bring up an inline toolbar.

![formating note block](Text_text-notes-formatting.png)2\. Clicking on the block toolbar.

## Read-Only vs. Editing Mode

Text notes are usually opened in edit mode. However, they may open in read-only mode if the note is too big or the note is explicitly marked as read-only. For more information, see [Read-Only Notes](../Basic%20Concepts%20and%20Features/Notes/Read-Only%20Notes.md).

## General Formatting

Since Trilium uses CKEditor, all of its formatting options are available here. You may use the graphical toolbar shown above, or enter formatting such as markdown markdown directly in the text. Examples include:

*   **Bold**: Type `**text**` or `__text__`
*   _Italic_: Type `*text*` or `_text_`
*   ~~Strikethrough~~: Type `~~text~~`

### Lists

See [Lists](Text/Lists.md).

### Blocks

*   Block quote: Start a line with `>` followed by a space

## Developer-specific formatting

The following features are supported:

*   Inline code
*   [Code blocks](Text/Developer-specific%20formatting/Code%20blocks.md)

See [Developer-specific formatting](Text/Developer-specific%20formatting.md) for more information.

### Headings

Create headings by starting a line with `##` for heading 2, `###` for heading 3, and so on up to heading 6. Note that `#` is reserved for the title.

### Horizontal Line

Insert a horizontal line by starting a line with `---`.

## Markdown & Autoformat

CKEditor supports a markdown-like editing experience, recognising syntax and automatically converting it to rich text.

![](Text_image.png)

Complete documentation for this feature is available in the [CKEditor documentation](https://ckeditor.com/docs/ckeditor5/latest/features/autoformat.html).

If autoformatting is not desirable, press <kbd>Ctrl</kbd> + <kbd>Z</kbd> to revert the text to its original form.

Note: The use of `#` for Heading 1 is not supported because it is reserved for the title. Start with `##` for Heading 2. More information is available [here](https://ckeditor.com/docs/ckeditor5/latest/features/headings.html#heading-levels).

## Math Support

Trilium provides math support through [KaTeX](https://katex.org/).

<figure class="image image_resized" style="height:auto;width:auto;"><img style="aspect-ratio:812/585;" src="Text_math.gif" width="812" height="585"></figure>