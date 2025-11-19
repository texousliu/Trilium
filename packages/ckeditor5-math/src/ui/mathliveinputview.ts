import { View, type Locale } from 'ckeditor5';

/**
 * A view that wraps the MathLive `<math-field>` web component for interactive LaTeX equation editing.
 *
 * MathLive provides a rich math input experience with live rendering, virtual keyboard support,
 * and various accessibility features.
 *
 * @see https://cortexjs.io/mathlive/
 */
export default class MathLiveInputView extends View {
	/**
	 * The current LaTeX value of the math field.
	 *
	 * @observable
	 */
	public declare value: string;

	/**
	 * Whether the input is in read-only mode.
	 *
	 * @observable
	 */
	public declare isReadOnly: boolean;

	/**
	 * Reference to the `<math-field>` DOM element.
	 */
	public mathfield: HTMLElement | null = null;

	constructor( locale: Locale ) {
		super( locale );

		this.set( 'value', '' );
		this.set( 'isReadOnly', false );

		this.setTemplate( {
			tag: 'div',
			attributes: {
				class: [ 'ck', 'ck-mathlive-input' ]
			}
		} );
	}git config --local credential.helper ""

	/**
	 * @inheritDoc
	 */
	public override render(): void {
		super.render();

		// Create the MathLive math-field custom element
		const mathfield = document.createElement( 'math-field' ) as any;
		this.mathfield = mathfield;

		// Configure the virtual keyboard to be manually controlled (shown by user interaction)
		mathfield.setAttribute( 'virtual-keyboard-mode', 'manual' );

		// Set initial value
		if ( this.value ) {
			( mathfield as any ).value = this.value;
		}

		// Bind readonly state
		if ( this.isReadOnly ) {
			( mathfield as any ).readOnly = true;
		}

		// Sync math-field changes to observable value
		mathfield.addEventListener( 'input', () => {
			this.value = ( mathfield as any ).value;
		} );

		// Sync observable value changes back to math-field
		this.on( 'change:value', () => {
			if ( ( mathfield as any ).value !== this.value ) {
				( mathfield as any ).value = this.value;
			}
		} );

		// Sync readonly state to math-field
		this.on( 'change:isReadOnly', () => {
			( mathfield as any ).readOnly = this.isReadOnly;
		} );

		this.element?.appendChild( mathfield );
	}

	/**
	 * Focuses the math-field element.
	 */
	public focus(): void {
		this.mathfield?.focus();
	}

	/**
	 * @inheritDoc
	 */
	public override destroy(): void {
		if ( this.mathfield ) {
			this.mathfield.remove();
			this.mathfield = null;
		}
		super.destroy();
	}
}
