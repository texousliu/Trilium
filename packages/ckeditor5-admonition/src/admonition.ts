import { Plugin, ButtonView } from 'ckeditor5';

import admonitionIcon from '../theme/icons/admonition.svg';
import AdmonitionEditing from './admonitionediting.js';
import AdmonitionUI from './admonitionui.js';
import AdmonitionAutoformat from './admonitionautoformat.js';

export default class Admonition extends Plugin {

	public static get requires() {
		return [ AdmonitionEditing, AdmonitionUI, AdmonitionAutoformat ] as const;
	}

	public static get pluginName() {
		return 'Admonition' as const;
	}

	public init(): void {
		const editor = this.editor;
		const t = editor.t;
		const model = editor.model;

		// Register the "admonition" button, so it can be displayed in the toolbar.
		editor.ui.componentFactory.add( 'admonition', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: t( 'Admonition' ),
				icon: admonitionIcon,
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
