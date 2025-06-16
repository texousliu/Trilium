import type { Editor } from 'ckeditor5';
import type { SlashCommandEditorConfig  } from 'ckeditor5-premium-features';
import { icons as admonitionIcons } from '@triliumnext/ckeditor5-admonition';
import { icons as footnoteIcons } from '@triliumnext/ckeditor5-footnotes';
import { ADMONITION_TYPES, type AdmonitionType } from '@triliumnext/ckeditor5-admonition';

type SlashCommandDefinition = SlashCommandEditorConfig["extraCommands"][number];

export default function buildExtraCommands(): SlashCommandDefinition[] {
    return [
        ...buildAdmonitionExtraCommands(),
        ...buildFootnoteExtraCommands()
    ];
}

function buildAdmonitionExtraCommands(): SlashCommandDefinition[] {
    const commands: SlashCommandDefinition[] = [];
    for (const [ keyword, definition ] of Object.entries(ADMONITION_TYPES)) {
        commands.push({
            id: keyword,
            title: `Admonition: ${definition.title}`,
            icon: admonitionIcons.admonitionIcon,
            execute: (editor: Editor) => editor.execute("admonition", { forceValue: keyword as AdmonitionType })
        });
    }
    return commands;
}

function buildFootnoteExtraCommands(): SlashCommandDefinition[] {
    return [
        {
            id: 'footnote',
            title: 'Footnote',
            description: 'Create a new footnote and reference it here',
            icon: footnoteIcons.insertFootnoteIcon,
            execute: (editor: Editor) => editor.execute("InsertFootnote")
        }
    ];
}
