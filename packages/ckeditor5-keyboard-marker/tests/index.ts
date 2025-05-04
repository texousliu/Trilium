import { describe, expect, it } from 'vitest';
import { KeyboardMarker as KeyboardMarkerDll, icons } from '../src/index.js';
import KeyboardMarker from '../src/keyboardmarker.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 KeyboardMarker DLL', () => {
	it( 'exports KeyboardMarker', () => {
		expect( KeyboardMarkerDll ).to.equal( KeyboardMarker );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
