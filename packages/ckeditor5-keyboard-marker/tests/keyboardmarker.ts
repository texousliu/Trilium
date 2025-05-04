import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ClassicEditor, Essentials, Paragraph, Heading } from 'ckeditor5';
import KeyboardMarker from '../src/keyboardmarker.js';

describe( 'KeyboardMarker', () => {
	it( 'should be named', () => {
		expect( KeyboardMarker.pluginName ).to.equal( 'KeyboardMarker' );
	} );

	describe( 'init()', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				licenseKey: 'GPL',
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					KeyboardMarker
				],
				toolbar: [
					'keyboardMarker'
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load KeyboardMarker', () => {
			const myPlugin = editor.plugins.get( 'KeyboardMarker' );

			expect( myPlugin ).to.be.an.instanceof( KeyboardMarker );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'keyboardMarker' ) ).to.equal( true );
		} );

		it( 'should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'keyboardMarker' );

			expect( editor.getData() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
		} );
	} );
} );
