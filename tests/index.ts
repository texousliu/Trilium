import { expect } from 'chai';
import { Footnotes as FootnotesDll, icons } from '../src/index.js';
import Footnotes from '../src/footnotes.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 Footnotes DLL', () => {
	it( 'exports Footnotes', () => {
		expect( FootnotesDll ).to.equal( Footnotes );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
