# Syntax highlighting & word wrapping for code blocks
Finally, syntax highlighting was added as a feature for code blocks:

<figure class="image"><img src="api/images/3oQodG5TcShj/1_Syntax highlighting &amp; word.png"></figure>

## Context

In order to achieve the syntax highlight, the Highlight.js library is being used. Do note that support for syntax highlighting in code blocks is not a supported feature of the text editor we are using CKEditor), but rather a hack which makes use of the highlights API (used for highlighting search results for example). Nevertheless, we haven't noticed any major issues during the development of the feature, but feel free to report any issues you might have.

Most of the work to achieve the syntax highlight itself was already done by [antoniotejada](https://github.com/antoniotejada) in [https://github.com/antoniotejada/Trilium-SyntaxHighlightWidget](https://github.com/antoniotejada/Trilium-SyntaxHighlightWidget). On our side we added customization but also additional functionality.

## Migrating from existing syntax highlight plugins

If you are already using a syntax highlighting plugin such as the [Trilium-SyntaxHighlightWidget](https://github.com/antoniotejada/Trilium-SyntaxHighlightWidget) we are basing off of, it is important to disable that plugin before upgrading in order for it not to conflict with our implementation.

Should you encounter any issues after the migration, try running Trilium in safe mode.

## New section in settings

In order to configure this new feature, a section has been added in Options → Appearance to control the syntax highlighting. There the color scheme can be chosen, from a builtin selection of themes from Highlight.js.

It is also now possible to disable the word wrapping for code blocks, which can make them easier to read for large amounts of code. Word wrapping has now been disabled by default.

It is also possible to disable the syntax highlighting by selecting “No syntax highlighting” in the “Color scheme” option.

<figure class="image"><img src="api/images/N6uWE52zBICS/Syntax highlighting &amp; word.png"></figure>

## Using the syntax highlight in auto mode

Provided the syntax highlighting is enabled in the settings, simply create a code block within a text note and it will try to automatically detect the language (using the Highlight.js library):

<figure class="image"><img src="api/images/MtdkRx65ZpMl/2_Syntax highlighting &amp; word.png"></figure>

## Adjusting the language manually

Should the automatic syntax highlight not work well enough, it is possible to manually adjust the language of the code block:

<figure class="image"><img src="api/images/v5rGTnSeekYT/3_Syntax highlighting &amp; word.png"></figure>

## Adding support for new languages

By going to settings → Code Notes → Available MIME types in the dropdown, it is possible to adjust the languages that are used for code blocks as well.

Note that not all languages that are present in this list (which is meant for code blocks, using CodeMirror as editor) are supported by our syntax highlight library. In this case you will simply see no syntax highlighting when you select the language.

If syntax highlighting is not supported for a given language, feel free to open an issue and we will look whether it is possible to integrate it.

## Automatic disable of syntax highlighting

Note that when editing a text note, syntax highlighting is automatically disabled if the code block is too big (somewhere around 500 lines). This value is currently not configured.

For read-only text notes, this limitation is not applied.