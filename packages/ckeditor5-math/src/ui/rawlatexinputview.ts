import { LabeledFieldView, createLabeledTextarea, type Locale, type TextareaView } from 'ckeditor5';

/**
 * A labeled textarea view for direct LaTeX code editing.
 *
 * This provides a plain text input for users who prefer to write LaTeX syntax directly
 * or need to paste/edit raw LaTeX code.
 */
export default class RawLatexInputView extends LabeledFieldView<TextareaView> {
	/**
	 * The current LaTeX value.
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

	constructor( locale: Locale ) {
		super( locale, createLabeledTextarea );

		this.set( 'value', '' );
		this.set( 'isReadOnly', false );

		const fieldView = this.fieldView;

		// Sync textarea input to observable value
		fieldView.on( 'input', () => {
			if ( fieldView.element ) {
				this.value = fieldView.element.value;
			}
		} );

		// Sync observable value changes back to textarea
		this.on( 'change:value', () => {
			if ( fieldView.element && fieldView.element.value !== this.value ) {
				fieldView.element.value = this.value;
			}
		} );

		// Sync readonly state (manual binding to avoid CKEditor observable rebind error)
		this.on( 'change:isReadOnly', () => {
			if ( fieldView.element ) {
				fieldView.element.readOnly = this.isReadOnly;
			}
		} );
	}

	/**
	 * @inheritDoc
	 */
	public override render(): void {
		super.render();
		// All styling is handled via CSS in mathform.css
		// (Removed obsolete mousedown propagation; no longer needed after resize & gray-area click removal.)
	}
}
