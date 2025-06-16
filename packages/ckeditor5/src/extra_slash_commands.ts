import type { Editor } from 'ckeditor5';
import type { SlashCommandEditorConfig  } from 'ckeditor5-premium-features';
import { icons as admonitionIcons } from '@triliumnext/ckeditor5-admonition';
import { icons as footnoteIcons } from '@triliumnext/ckeditor5-footnotes';
import IconPageBreak from "@ckeditor/ckeditor5-icons/theme/icons/page-break.svg?raw";
import { COMMAND_NAME as INSERT_DATE_TIME_COMMAND } from './plugins/insert_date_time.js';
import { COMMAND_NAME as INTERNAL_LINK_COMMAND } from './plugins/internallink.js';
import { COMMAND_NAME as INCLUDE_NOTE_COMMAND } from './plugins/includenote.js';
import { ADMONITION_TYPES, type AdmonitionType } from '@triliumnext/ckeditor5-admonition';
import dateTimeIcon from './icons/date-time.svg?raw';
import internalLinkIcon from './icons/trilium.svg?raw';
import noteIcon from './icons/note.svg?raw';
import { icons as mathIcons, MathUI } from '@triliumnext/ckeditor5-math';

type SlashCommandDefinition = SlashCommandEditorConfig["extraCommands"][number];

export default function buildExtraCommands(): SlashCommandDefinition[] {
    return [
        ...buildAdmonitionExtraCommands(),
        {
            id: 'footnote',
            title: 'Footnote',
            description: 'Create a new footnote and reference it here',
            icon: footnoteIcons.insertFootnoteIcon,
            commandName: "InsertFootnote"
        },
        {
            id: "datetime",
            title: "Insert Date/Time",
            description: "Insert the current date and time",
            icon: dateTimeIcon,
            commandName: INSERT_DATE_TIME_COMMAND
        },
        {
            id: "internal-link",
            title: "Internal Trilium link",
            description: "Insert a link to another Trilium note",
            icon: internalLinkIcon,
            commandName: INTERNAL_LINK_COMMAND
        },
        {
            id: "math",
            title: "Math equation",
            description: "Insert a math equation",
            icon: mathIcons.ckeditor,
            execute: (editor: Editor) => editor.plugins.get(MathUI)._showUI()
        },
        {
            id: "include-note",
            title: "Include note",
            description: "Display the content of another note in this note",
            icon: noteIcon,
            commandName: INCLUDE_NOTE_COMMAND
        },
        {
            id: "page-break",
            title: "Page break",
            description: "Insert a page break (for printing)",
            icon: IconPageBreak,
            commandName: "pageBreak"
        }
    ];
}

function buildAdmonitionExtraCommands(): SlashCommandDefinition[] {
    const commands: SlashCommandDefinition[] = [];
    for (const [ keyword, definition ] of Object.entries(ADMONITION_TYPES)) {
        commands.push({
            id: keyword,
            title: definition.title,
            description: "Inserts a new admonition",
            icon: admonitionIcons.admonitionIcon,
            execute: (editor: Editor) => editor.execute("admonition", { forceValue: keyword as AdmonitionType })
        });
    }
    return commands;
}

