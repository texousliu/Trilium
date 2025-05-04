import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { ClassicEditor, Essentials, Paragraph, Heading } from 'ckeditor5';
import Mermaid from '../src/mermaid.js';

describe( 'Mermaid', () => {
	it( 'should be named', () => {
		expect( Mermaid.pluginName ).to.equal( 'Mermaid' );
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
					Mermaid
				],
				toolbar: [
					'mermaid'
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load Mermaid', () => {
			const myPlugin = editor.plugins.get( 'Mermaid' );

			expect( myPlugin ).to.be.an.instanceof( Mermaid );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'mermaid' ) ).to.equal( true );
		} );

		it( 'should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'mermaid' );

			expect( editor.getData() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
		} );
	} );
} );
