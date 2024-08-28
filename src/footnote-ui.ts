import {
	addListToDropdown,
	Collection,
	createDropdown,
	Plugin,
	ViewModel,
	type ListDropdownItemDefinition
} from 'ckeditor5';

import {
	ATTRIBUTES,
	COMMANDS,
	ELEMENTS,
	TOOLBAR_COMPONENT_NAME
} from './constants.js';
import insertFootnoteIcon from '../theme/icons/insert-footnote.svg';
import { modelQueryElement, modelQueryElementsAll } from './utils.js';

export default class FootnoteUI extends Plugin {
	public init(): void {
		const editor = this.editor;
		const translate = editor.t;

		editor.ui.componentFactory.add( TOOLBAR_COMPONENT_NAME, locale => {
			const dropdownView = createDropdown( locale );

			// Populate the list in the dropdown with items.
			// addListToDropdown( dropdownView, getDropdownItemsDefinitions( placeholderNames ) );
			const command = editor.commands.get( COMMANDS.insertFootnote );
			if ( !command ) {
				throw new Error( 'Command not found.' );
			}

			dropdownView.buttonView.set( {
				label: translate( 'Footnote' ),
				icon: insertFootnoteIcon,
				tooltip: true
			} );

			dropdownView.class = 'ck-code-block-dropdown';
			dropdownView.bind( 'isEnabled' ).to( command );
			dropdownView.on(
				'change:isOpen',
				( evt, propertyName, newValue ) => {
					if ( newValue ) {
						addListToDropdown(
							dropdownView,
							this.getDropdownItemsDefinitions() as any
						);
					} else {
						dropdownView?.listView?.items.clear();
					}
				}
			);
			// Execute the command when the dropdown item is clicked (executed).
			this.listenTo( dropdownView, 'execute', evt => {
				console.log( 'commandParam', ( evt.source as any ).commandParam );
				editor.execute( COMMANDS.insertFootnote, {
					footnoteIndex: ( evt.source as any ).commandParam
				} );
				console.log( 'completed execution' );
				editor.editing.view.focus();
				console.log( 'post focus' );
			} );

			return dropdownView;
		} );
	}

	public getDropdownItemsDefinitions(): Collection<ListDropdownItemDefinition> {
		const itemDefinitions = new Collection<ListDropdownItemDefinition>();
		const defaultDef: ListDropdownItemDefinition = {
			type: 'button',
			model: new ViewModel( {
				commandParam: 0,
				label: 'New footnote',
				withText: true
			} )
		};
		itemDefinitions.add( defaultDef );

		const rootElement = this.editor.model.document.getRoot();
		if ( !rootElement ) {
			throw new Error( 'Document has no root element.' );
		}

		const footnoteSection = modelQueryElement(
			this.editor,
			rootElement,
			element => element.is( 'element', ELEMENTS.footnoteSection )
		);

		if ( footnoteSection ) {
			const footnoteItems = modelQueryElementsAll(
				this.editor,
				rootElement,
				element => element.is( 'element', ELEMENTS.footnoteItem )
			);
			footnoteItems.forEach( footnote => {
				const index = footnote.getAttribute( ATTRIBUTES.footnoteIndex );
				const definition: ListDropdownItemDefinition = {
					type: 'button',
					model: new ViewModel( {
						commandParam: index,
						label: `Insert footnote ${ index }`,
						withText: true
					} )
				};

				itemDefinitions.add( definition );
			} );
		}

		return itemDefinitions;
	}
}
