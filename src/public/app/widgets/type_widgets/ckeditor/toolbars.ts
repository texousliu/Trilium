export function buildToolbarConfig() {
    return buildClassicToolbar();
}

function buildClassicToolbar() {
    // For nested toolbars, refer to https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/toolbar.html#grouping-toolbar-items-in-dropdowns-nested-toolbars.
    return {
        items: [
            'heading',
            'fontSize',
            '|',
            'bold',
            'italic',
            {
                label: "Text formatting",
                icon: "text",
                items: [
                    'underline',
                    'strikethrough',
                    'superscript',
                    'subscript',
                    'code',
                ],
            },
            '|',
            'fontColor',
            'fontBackgroundColor',
            'removeFormat',
            '|',
            'bulletedList', 'numberedList', 'todoList',
            '|',
            'blockQuote',
            'insertTable',
            'codeBlock',
            'footnote',
            {
                label: "Insert",
                icon: "plus",
                items: [
                    'imageUpload',
                    '|',
                    'link',
                    'internallink',
                    'includeNote',
                    '|',
                    'specialCharacters',
                    'math',
                    'mermaid',
                    'horizontalLine',
                    'pageBreak'
                ]
            },
            '|',
            'outdent', 'indent',
            '|',
            'markdownImport',
            'cuttonote',
            'findAndReplace'
        ]
    }
}
