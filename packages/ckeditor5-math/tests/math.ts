import { ClassicEditor, Widget } from 'ckeditor5';
import Mathematics from '../src/math.js';
import MathEditing from '../src/mathediting.js';
import MathUI from '../src/mathui.js';
import AutoMath from '../src/automath.js';
import { expect } from 'chai';
import { describe, beforeEach, it, afterEach } from "vitest";

describe( 'Math', () => {
	let editorElement: HTMLDivElement, editor: ClassicEditor;

	beforeEach( async () => {
		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		return ClassicEditor
			.create( editorElement, {
				plugins: [ Mathematics ]
			} )
			.then( newEditor => {
				editor = newEditor;
			} );
	} );

	afterEach( () => {
		editorElement.remove();

		return editor.destroy();
	} );

	it( 'should be loaded', () => {
		expect( editor.plugins.get( Mathematics ) ).to.instanceOf( Mathematics );
	} );

	it( 'should load MathEditing plugin', () => {
		expect( editor.plugins.get( MathEditing ) ).to.instanceOf( MathEditing );
	} );

	it( 'should load Widget plugin', () => {
		expect( editor.plugins.get( Widget ) ).to.instanceOf( Widget );
	} );

	it( 'should load MathUI plugin', () => {
		expect( editor.plugins.get( MathUI ) ).to.instanceOf( MathUI );
	} );

	it( 'should load AutoMath plugin', () => {
		expect( editor.plugins.get( AutoMath ) ).to.instanceOf( AutoMath );
	} );

	it( 'has proper name', () => {
		expect( Mathematics.pluginName ).to.equal( 'Math' );
	} );
} );
