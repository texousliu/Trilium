import options from "../../../services/options.js";
import utils from "../../../services/utils.js";

export function buildToolbarConfig(isClassicToolbar: boolean) {
    if (isClassicToolbar) {
        const multilineToolbar = utils.isDesktop() && options.get("textNoteEditorMultilineToolbar") === "true"
        return buildClassicToolbar(multilineToolbar);
    } else {
        return buildFloatingToolbar();
    }
}

function buildClassicToolbar(multilineToolbar: boolean) {
    // For nested toolbars, refer to https://ckeditor.com/docs/ckeditor5/latest/getting-started/setup/toolbar.html#grouping-toolbar-items-in-dropdowns-nested-toolbars.
    return {
        toolbar: {
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
            ],
            shouldNotGroupWhenFull: multilineToolbar
        }
    }
}

function buildFloatingToolbar() {
    return {
        toolbar: {
			items: [
				'fontSize',
				'bold',
				'italic',
				'underline',
				'strikethrough',
				'superscript',
				'subscript',
				'fontColor',
				'fontBackgroundColor',
				'code',
				'link',
				'removeFormat',
				'internallink',
				'cuttonote'
			]
		},

		blockToolbar: [
			'heading',
			'|',
			'bulletedList', 'numberedList', 'todoList',
			'|',
			'blockQuote', 'codeBlock', 'insertTable',
			'footnote',
			{
				label: "Insert",
				icon: "plus",
				items: [
					'internallink',
					'includeNote',
					'|',
					'math',
					'mermaid',
					'horizontalLine',
					'pageBreak'
				]
			},
			'|',
			'outdent', 'indent',
			'|',
			'imageUpload',
			'markdownImport',
			'specialCharacters',
			'findAndReplace'
		]
    };
}
