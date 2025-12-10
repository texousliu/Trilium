import { View, type Locale, type FocusableView } from 'ckeditor5';

interface MathFieldElement extends HTMLElement {
	value: string;
	readOnly: boolean;
	mathVirtualKeyboardPolicy: string;
	inlineShortcuts?: Record<string, string>;
	setValue( value: string, options?: { silenceNotifications?: boolean } ): void;
}

export class MathFieldFocusableView extends View implements FocusableView {
	public declare element: HTMLElement | null;
	private _mathInputView: MathInputView;

	constructor( locale: Locale, mathInputView: MathInputView ) {
		super( locale );
		this._mathInputView = mathInputView;
	}

	public focus(): void {
		this._mathInputView.mathfield?.focus();
	}

	public setElement( el: HTMLElement ): void {
		( this as any ).element = el;
	}
}

export class LatexTextAreaView extends View implements FocusableView {
	declare public element: HTMLTextAreaElement;

	constructor( locale: Locale ) {
		super( locale );
		this.setTemplate( {
			tag: 'textarea',
			attributes: {
				class: [ 'ck', 'ck-textarea', 'ck-latex-textarea' ],
				autocapitalize: 'off',
				autocomplete: 'off',
				autocorrect: 'off',
				spellcheck: 'false',
				tabindex: 0
			}
		} );
	}

	public focus(): void {
		this.element?.focus();
	}
}

export default class MathInputView extends View {
	public declare value: string | null;
	public declare isReadOnly: boolean;
	public mathfield: MathFieldElement | null = null;
	public readonly latexTextAreaView: LatexTextAreaView;
	public readonly mathFieldFocusableView: MathFieldFocusableView;

	constructor( locale: Locale ) {
		super( locale );
		const t = locale.t;

		this.latexTextAreaView = new LatexTextAreaView( locale );
		this.mathFieldFocusableView = new MathFieldFocusableView( locale, this );

		this.set( 'value', null );
		this.set( 'isReadOnly', false );

		this.setTemplate( {
			tag: 'div',
			attributes: { class: [ 'ck', 'ck-math-input' ] },
			children: [
				{ tag: 'div', attributes: { class: [ 'ck-mathlive-container' ] } },
				{ tag: 'label', attributes: { class: [ 'ck-latex-label' ] }, children: [ t( 'LaTeX' ) ] },
				{ tag: 'div', attributes: { class: [ 'ck-latex-wrapper' ] }, children: [ this.latexTextAreaView ] }
			]
		} );
	}

	public override render(): void {
		super.render();

		const textarea = this.latexTextAreaView.element;
		textarea.value = this.value ?? '';
		textarea.readOnly = this.isReadOnly;

		if ( this.mathfield ) {
			this.mathfield.remove();
			this.mathfield = null;
		}

		textarea.addEventListener( 'input', () => {
			const val = textarea.value;
			if ( this.mathfield ) {
				this.mathfield.setValue( val, { silenceNotifications: true } );
			}
			this.value = val || null;
		} );

		this.on( 'change:value', ( _e, _n, val ) => {
			const newVal = val ?? '';
			textarea.value = newVal;
			if ( this.mathfield && this.mathfield.value !== newVal ) {
				this.mathfield.setValue( newVal, { silenceNotifications: true } );
			}
		} );

		this.on( 'change:isReadOnly', ( _e, _n, val ) => {
			textarea.readOnly = val;
			if ( this.mathfield ) {
				this.mathfield.readOnly = val;
			}
		} );

		const vk = ( window as any ).mathVirtualKeyboard;
		if ( vk ) {
			vk.addEventListener( 'geometrychange', () => {
				if ( vk.visible && document.activeElement === textarea && this.mathfield ) {
					this.mathfield.focus();
				}
			} );
		}

		this._loadMathLive();
	}

	private async _loadMathLive(): Promise<void> {
		try {
			await import( 'mathlive' );
			await customElements.whenDefined( 'math-field' );

			const MathfieldClass = customElements.get( 'math-field' ) as any;
			if ( MathfieldClass ) {
				MathfieldClass.soundsDirectory = null;
				MathfieldClass.plonkSound = null;
			}

			if ( this.element ) {
				this._createMathField();
			}
		} catch ( e ) {
			console.error( 'MathLive load failed:', e );
			const c = this.element?.querySelector( '.ck-mathlive-container' );
			if ( c ) {
				c.textContent = 'Math editor unavailable';
			}
		}
	}

	private _createMathField(): void {
		const container = this.element?.querySelector( '.ck-mathlive-container' );
		if ( !container ) {
			return;
		}

		const mf = document.createElement( 'math-field' ) as MathFieldElement;
		mf.mathVirtualKeyboardPolicy = 'auto';
		mf.setAttribute( 'tabindex', '-1' );
		mf.value = this.value ?? '';
		mf.readOnly = this.isReadOnly;

		mf.addEventListener( 'mount', () => {
			mf.inlineShortcuts = { ...mf.inlineShortcuts, dx: '', dy: '', dt: '' };
		}, { once: true } );

		mf.addEventListener( 'input', () => {
			const val = mf.value;
			this.latexTextAreaView.element.value = val;
			this.value = val || null;
		} );

		container.appendChild( mf );
		this.mathfield = mf;
		this.mathFieldFocusableView.setElement( mf );
		this.fire( 'mathfieldReady' );
	}

	public focus(): void {
		this.mathfield?.focus();
	}

	public hideKeyboard(): void {
		const vk = ( window as any ).mathVirtualKeyboard;
		if ( vk?.visible ) {
			vk.hide();
		}
	}

	public override destroy(): void {
		this.hideKeyboard();
		if ( this.mathfield ) {
			try {
				this.mathfield.blur();
				this.mathfield.remove();
			} catch { /* ignore */ }
			this.mathfield = null;
		}
		super.destroy();
	}
}
