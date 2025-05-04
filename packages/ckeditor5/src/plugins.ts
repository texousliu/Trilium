import { Autoformat, AutoLink, BlockQuote, Bold, CKFinderUploadAdapter, Clipboard, Code, CodeBlock, Enter, FindAndReplace, Font, FontBackgroundColor, FontColor, GeneralHtmlSupport, Heading, HeadingButtonsUI, HorizontalLine, Image, ImageCaption, ImageInline, ImageResize, ImageStyle, ImageToolbar, ImageUpload, Indent, IndentBlock, Italic, Link, List, ListProperties, Mention, PageBreak, Paragraph, ParagraphButtonUI, PasteFromOffice, PictureEditing, RemoveFormat, SelectAll, ShiftEnter, SpecialCharacters, SpecialCharactersEssentials, Strikethrough, Style, Subscript, Superscript, Table, TableCaption, TableCellProperties, TableColumnResize, TableProperties, TableSelection, TableToolbar, TextPartLanguage, TextTransformation, TodoList, Typing, Underline, Undo } from "ckeditor5";
import type { Plugin } from "ckeditor5";
import CutToNotePlugin from "./plugins/cuttonote.js";
import UploadimagePlugin from "./plugins/uploadimage.js";
import ItalicAsEmPlugin from "./plugins/italic_as_em.js";
import StrikethroughAsDel from "./plugins/strikethrough_as_del.js";
import InternalLinkPlugin from "./plugins/internallink.js";
import ReferenceLink from "./plugins/referencelink.js";
import RemoveFormatLinksPlugin from "./plugins/remove_format_links.js";
import SpecialCharactersEmojiPlugin from "./plugins/special_characters_emoji.js";
import IndentBlockShortcutPlugin from "./plugins/indent_block_shortcut.js";
import MarkdownImportPlugin from "./plugins/markdownimport.js";
import MentionCustomization from "./plugins/mention_customization.js";
import IncludeNote from "./plugins/includenote.js";
import Uploadfileplugin from "./plugins/file_upload/uploadfileplugin.js";
import { Kbd } from "@triliumnext/ckeditor5-keyboard-marker";

const TRILIUM_PLUGINS: typeof Plugin[] = [
    CutToNotePlugin,
    ItalicAsEmPlugin,
	StrikethroughAsDel,
    ReferenceLink,
    UploadimagePlugin,
    InternalLinkPlugin,
    RemoveFormatLinksPlugin,
    SpecialCharactersEmojiPlugin,
    IndentBlockShortcutPlugin,
    MarkdownImportPlugin,
    MentionCustomization,
    IncludeNote,
    Uploadfileplugin
];

const EXTERNAL_PLUGINS: typeof Plugin[] = [
    Kbd
];

export const COMMON_PLUGINS: typeof Plugin[] = [
    ...TRILIUM_PLUGINS,
    ...EXTERNAL_PLUGINS,

	// essentials package expanded to allow selectively disable Enter and ShiftEnter
	Clipboard, Enter, SelectAll, ShiftEnter, Typing, Undo,
	CKFinderUploadAdapter,
	Autoformat,
	Bold,
	Italic,
	Underline,
	Strikethrough,
	Code,
	Superscript,
	Subscript,
	BlockQuote,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	ImageResize,
	ImageInline,
	Link,
	AutoLink,
	List,
	ListProperties,
	TodoList,
	Paragraph,
	PasteFromOffice,
	PictureEditing,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,
	TableSelection,
	TableCaption,
	TableColumnResize,
	Indent,
	IndentBlock,
	ParagraphButtonUI,
	HeadingButtonsUI,
	TextTransformation,
	Font,
	FontColor,
	FontBackgroundColor,
	CodeBlock,
	SelectAll,
	HorizontalLine,
	RemoveFormat,
	SpecialCharacters,
	SpecialCharactersEssentials,
	FindAndReplace,
	Mention,
	PageBreak,
	GeneralHtmlSupport,
	TextPartLanguage,
	Style,

	// External plugins
	// Math,
	// AutoformatMath,
	// Footnotes,
	// Mermaid,
	// Admonition
];

export const COMMON_SETTINGS = { };
