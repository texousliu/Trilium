import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ClassicEditor, Essentials, Paragraph, Heading } from 'ckeditor5';
import Footnotes from '../src/footnotes.js';

describe( 'Footnotes', () => {
	it( 'should be named', () => {
		expect( Footnotes.pluginName ).to.equal( 'Footnotes' );
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
					Footnotes
				],
				toolbar: [
					'footnotes'
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load Footnotes', () => {
			const myPlugin = editor.plugins.get( 'Footnotes' );

			expect( myPlugin ).to.be.an.instanceof( Footnotes );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'footnotes' ) ).to.equal( true );
		} );

		it( 'should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'footnotes' );

			expect( editor.getData() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
		} );
	} );
} );
