import { describe, expect, it } from 'vitest';
import { Mermaid as MermaidDll, icons } from '../src/index.js';
import Mermaid from '../src/mermaid.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 Mermaid DLL', () => {
	it( 'exports Mermaid', () => {
		expect( MermaidDll ).to.equal( Mermaid );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
