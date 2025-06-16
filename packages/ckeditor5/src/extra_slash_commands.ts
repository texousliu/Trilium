import type { Editor } from 'ckeditor5';
import type { SlashCommandEditorConfig  } from 'ckeditor5-premium-features';
import { icons as admonitionIcons } from '@triliumnext/ckeditor5-admonition';
import { icons as footnoteIcons } from '@triliumnext/ckeditor5-footnotes';
import { ADMONITION_TYPES, type AdmonitionType } from '@triliumnext/ckeditor5-admonition';
import dateTimeIcon from './icons/date-time.svg?raw';

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
            commandName: "insertDateTimeToText"
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

