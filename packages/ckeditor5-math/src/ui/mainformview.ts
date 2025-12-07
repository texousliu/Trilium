import {
	ButtonView,
	FocusCycler,
	LabelView,
	submitHandler,
	SwitchButtonView,
	View,
	ViewCollection,
	type FocusableView,
	Locale,
	FocusTracker,
	KeystrokeHandler
} from 'ckeditor5';
import IconCheck from '@ckeditor/ckeditor5-icons/theme/icons/check.svg?raw';
import IconCancel from '@ckeditor/ckeditor5-icons/theme/icons/cancel.svg?raw';
import { extractDelimiters, hasDelimiters } from '../utils.js';
import MathView, { type MathViewOptions } from './mathview.js';
import MathInputView from './mathinputview.js';
import '../../theme/mathform.css';

export default class MainFormView extends View {
	public saveButtonView: ButtonView;
	public cancelButtonView: ButtonView;
	public displayButtonView: SwitchButtonView;

	public mathInputView: MathInputView;
	public mathView?: MathView;

	public focusTracker = new FocusTracker();
	public keystrokes = new KeystrokeHandler();
	private _focusables = new ViewCollection<FocusableView>();
	private _focusCycler: FocusCycler;

	constructor(
		locale: Locale,
		mathViewOptions: MathViewOptions,
		previewEnabled = false,
		popupClassName: string[] = []
	) {
		super( locale );
		const t = locale.t;

		// Create views
		this.mathInputView = new MathInputView( locale );
		this.saveButtonView = this._createButton( t( 'Save' ), IconCheck, 'ck-button-save', 'submit' );
		this.cancelButtonView = this._createButton( t( 'Cancel' ), IconCancel, 'ck-button-cancel' );
		this.cancelButtonView.delegate( 'execute' ).to( this, 'cancel' );
		this.displayButtonView = this._createDisplayButton( t );

		// Build children

		const children: View[] = [
			this.mathInputView,
			this.displayButtonView
		];

		if ( previewEnabled ) {
			const previewLabel = new LabelView( locale );
			previewLabel.text = t( 'Equation preview' );

			this.mathView = new MathView( locale, mathViewOptions );
			this.mathView.bind( 'display' ).to( this.displayButtonView, 'isOn' );

			children.push( previewLabel, this.mathView );
		}

		this._setupSync( previewEnabled );

		this.setTemplate( {
			tag: 'form',
			attributes: {
				class: [ 'ck', 'ck-math-form', ...popupClassName ],
				tabindex: '-1',
				spellcheck: 'false'
			},
			children: [
				{
					tag: 'div',
					attributes: { class: [ 'ck-math-scroll' ] },
					children: [ { tag: 'div', attributes: { class: [ 'ck-math-view' ] }, children } ]
				},
				{
					tag: 'div',
					attributes: { class: [ 'ck-math-button-row' ] },
					children: [ this.saveButtonView, this.cancelButtonView ]
				}
			]
		} );

		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: { focusPrevious: 'shift + tab', focusNext: 'tab' }
		} );
	}

	public override render(): void {
		super.render();

		submitHandler( { view: this } );

		// Register focusables
		[
			this.mathInputView,
			this.displayButtonView,
			this.saveButtonView,
			this.cancelButtonView
		].forEach( v => {
			if ( v.element ) {
				this._focusables.add( v );
				this.focusTracker.add( v.element );
			}
		} );

		if ( this.element ) this.keystrokes.listenTo( this.element );
	}

	public get equation(): string {
		return this.mathInputView.value ?? '';
	}

	public set equation( equation: string ) {
		const norm = equation.trim();
		this.mathInputView.value = norm.length ? norm : null;
		if ( this.mathView ) this.mathView.value = norm;
	}

	public focus(): void {
		this._focusCycler.focusFirst();
	}

	/** Handle delimiter stripping and preview updates. */
	private _setupSync(previewEnabled: boolean): void {
		this.mathInputView.on('change:value', () => {
			let eq = (this.mathInputView.value ?? '').trim();

			// Strip delimiters if present (e.g. pasted content)
			if (hasDelimiters(eq)) {
				const params = extractDelimiters(eq);
				eq = params.equation;
				this.displayButtonView.isOn = params.display;

				// Update the input with stripped delimiters
				if (this.mathInputView.value !== eq) {
					this.mathInputView.value = eq.length ? eq : null;
				}
			}

			// Update preview
			if (previewEnabled && this.mathView && this.mathView.value !== eq) {
				this.mathView.value = eq;
			}
		});
	}

	private _createButton( label: string, icon: string, className: string, type?: 'submit' | 'button' ): ButtonView {
		const btn = new ButtonView( this.locale );
		btn.set( { label, icon, tooltip: true } );
		btn.extendTemplate( { attributes: { class: className } } );
		if (type) btn.type = type;
		return btn;
	}

	private _createDisplayButton( t: ( str: string ) => string ): SwitchButtonView {
		const btn = new SwitchButtonView( this.locale );
		btn.set( { label: t( 'Display mode' ), withText: true } );
		btn.extendTemplate( { attributes: { class: 'ck-button-display-toggle' } } );

		btn.on( 'execute', () => {
			btn.isOn = !btn.isOn;
		} );
		return btn;
	}
}
