import { describe, expect, it } from 'vitest';
import { Admonition as AdmonitionDll, icons } from '../src/index.js';
import Admonition from '../src/admonition.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 Admonition DLL', () => {
	it( 'exports Admonition', () => {
		expect( AdmonitionDll ).to.equal( Admonition );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
