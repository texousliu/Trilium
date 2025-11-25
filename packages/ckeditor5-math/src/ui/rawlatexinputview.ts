import { LabeledFieldView, createLabeledTextarea, type Locale, type TextareaView } from 'ckeditor5';

/**
 * A labeled textarea view for direct LaTeX code editing.
 */
export default class RawLatexInputView extends LabeledFieldView<TextareaView> {
	/**
	 * The current LaTeX value.
	 * @observable
	 */
	public declare value: string;

	/**
	 * Whether the input is in read-only mode.
	 * @observable
	 */
	public declare isReadOnly: boolean;

	constructor( locale: Locale ) {
		super( locale, createLabeledTextarea );

		this.set( 'value', '' );
		this.set( 'isReadOnly', false );

		const fieldView = this.fieldView;

		// 1. Sync: DOM (Textarea) -> Observable
		// We listen to the native 'input' event on the child view
		fieldView.on( 'input', () => {
			if ( fieldView.element ) {
				this.value = fieldView.element.value;
			}
		} );

		// 2. Sync: Observable -> DOM (Textarea)
		this.on( 'change:value', () => {
			// Check for difference to avoid cursor jumping or unnecessary updates
			if ( fieldView.element && fieldView.element.value !== this.value ) {
				fieldView.element.value = this.value;
			}
		} );

		// 3. Sync: ReadOnly State
		this.on( 'change:isReadOnly', () => {
			if ( fieldView.element ) {
				fieldView.element.readOnly = this.isReadOnly;
			}
		} );
	}

	public override render(): void {
		super.render();
	}
}
