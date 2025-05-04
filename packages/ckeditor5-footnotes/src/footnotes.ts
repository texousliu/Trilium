import { Plugin, ButtonView } from 'ckeditor5';

import ckeditor5Icon from '../theme/icons/ckeditor.svg';

export default class Footnotes extends Plugin {
	public static get pluginName() {
		return 'Footnotes' as const;
	}

	public init(): void {
		const editor = this.editor;
		const t = editor.t;
		const model = editor.model;

		// Register the "footnotes" button, so it can be displayed in the toolbar.
		editor.ui.componentFactory.add( 'footnotes', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Footnotes' ),
				icon: ckeditor5Icon,
				tooltip: true
			} );

			// Insert a text into the editor after clicking the button.
			this.listenTo( view, 'execute', () => {
				model.change( writer => {
					const textNode = writer.createText( 'Hello CKEditor 5!' );

					model.insertContent( textNode );
				} );

				editor.editing.view.focus();
			} );

			return view;
		} );
	}
}
