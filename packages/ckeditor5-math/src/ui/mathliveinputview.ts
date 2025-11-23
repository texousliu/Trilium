import { View, type Locale } from 'ckeditor5';
import 'mathlive';

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
	public declare value: string | null;

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

		this.set( 'value', null );
		this.set( 'isReadOnly', false );

		this.setTemplate( {
			tag: 'div',
			attributes: {
				class: [ 'ck', 'ck-mathlive-input' ]
			}
		} );
	}

	/**
	 * @inheritDoc
	 */
	public override render(): void {
		super.render();

		// Propagate mousedown event to the view
		this.element!.addEventListener( 'mousedown', ( evt ) => {
			this.fire( 'mousedown', evt );
		} );

		// Create the MathLive math-field custom element
		const mathfield = document.createElement( 'math-field' ) as any;
		this.mathfield = mathfield;

		// Configure the virtual keyboard to be manually controlled (shown by user interaction)
		mathfield.setAttribute( 'virtual-keyboard-mode', 'manual' );

		// Set initial value
		const initialValue = this.value ?? '';
		if ( initialValue ) {
			( mathfield as any ).value = initialValue;
		}

		// Bind readonly state
		if ( this.isReadOnly ) {
			( mathfield as any ).readOnly = true;
		}

		// Sync math-field changes to observable value
		mathfield.addEventListener( 'input', () => {
			const nextValue: string = ( mathfield as any ).value;
			this.value = nextValue.length ? nextValue : null;
		} );

		// Sync observable value changes back to math-field
		this.on( 'change:value', () => {
			const nextValue = this.value ?? '';
			if ( ( mathfield as any ).value !== nextValue ) {
				( mathfield as any ).value = nextValue;
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
