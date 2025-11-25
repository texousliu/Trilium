import { View, type Locale } from 'ckeditor5';
import 'mathlive'; // Import side-effects only (registers the <math-field> tag)

/**
 * A wrapper for the MathLive <math-field> component.
 * Uses 'any' typing to avoid TypeScript module resolution errors.
 */
export default class MathLiveInputView extends View {
	/**
	 * The current LaTeX value.
	 * @observable
	 */
	public declare value: string | null;

	/**
	 * Read-only state.
	 * @observable
	 */
	public declare isReadOnly: boolean;

	/**
	 * Reference to the DOM element (typed as any to prevent TS errors).
	 */
	public mathfield: any = null;

	constructor( locale: Locale ) {
		super( locale );

		this.set( 'value', null );
		this.set( 'isReadOnly', false );

		this.setTemplate( {
			tag: 'div',
			attributes: {
				class: [ 'ck', 'ck-mathlive-input' ]
			}
		} );
	}

	public override render(): void {
		super.render();

		// 1. Create element using DOM API instead of Class constructor
		// This avoids "Module has no exported member" errors.
		const mathfield = document.createElement( 'math-field' ) as any;

		// 2. Configure Options
		mathfield.mathVirtualKeyboardPolicy = 'manual';

		// Disable sounds
		const MathfieldElement = customElements.get( 'math-field' );
		if ( MathfieldElement ) {
			( MathfieldElement as any ).soundsDirectory = null;
			( MathfieldElement as any ).plonkSound = null;
		}

		// 3. Set Initial State
		mathfield.value = this.value ?? '';
		mathfield.readOnly = this.isReadOnly;

		// 4. Bind Events (DOM -> Observable)
		mathfield.addEventListener( 'input', () => {
			const val = mathfield.value;
			this.value = val.length ? val : null;
		} );

		// 5. Bind Events (Observable -> DOM)
		this.on( 'change:value', ( _evt, _name, nextValue ) => {
			if ( mathfield.value !== nextValue ) {
				mathfield.value = nextValue ?? '';
			}
		} );

		this.on( 'change:isReadOnly', ( _evt, _name, nextValue ) => {
			mathfield.readOnly = nextValue;
		} );

		// 6. Mount
		this.element?.appendChild( mathfield );
		this.mathfield = mathfield;
	}

	public focus(): void {
		this.mathfield?.focus();
	}

	public override destroy(): void {
		if ( this.mathfield ) {
			this.mathfield.remove();
			this.mathfield = null;
		}
		super.destroy();
	}
}
