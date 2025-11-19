import { ButtonView, FocusCycler, LabelView, submitHandler, SwitchButtonView, View, ViewCollection, type FocusableView, Locale, FocusTracker, KeystrokeHandler } from 'ckeditor5';
import IconCheck from '../../theme/icons/check.svg?raw';
import IconCancel from '../../theme/icons/cancel.svg?raw';
import { extractDelimiters, hasDelimiters } from '../utils.js';
import MathView from './mathview.js';
import MathLiveInputView from './mathliveinputview.js';
import RawLatexInputView from './rawlatexinputview.js';
import '../../theme/mathform.css';
import type { KatexOptions } from '../typings-external.js';

export default class MainFormView extends View {
	public saveButtonView: ButtonView;
	public mathInputView: MathLiveInputView;
	public rawLatexInputView: RawLatexInputView;
	public rawLatexLabel: LabelView;
	public displayButtonView: SwitchButtonView;
	public cancelButtonView: ButtonView;
	public previewEnabled: boolean;
	public previewLabel?: LabelView;
	public mathView?: MathView;
	public override locale: Locale = new Locale();
	public lazyLoad: undefined | ( () => Promise<void> );

	constructor(
		locale: Locale,
		engine:
			| 'mathjax'
			| 'katex'
			| ( (
				equation: string,
				element: HTMLElement,
				display: boolean,
			) => void ),
		lazyLoad: undefined | ( () => Promise<void> ),
		previewEnabled = false,
		previewUid: string,
		previewClassName: Array<string>,
		popupClassName: Array<string>,
		katexRenderOptions: KatexOptions
	) {
		super( locale );

		const t = locale.t;

		// Submit button
		this.saveButtonView = this._createButton( t( 'Save' ), IconCheck, 'ck-button-save', null );
		this.saveButtonView.type = 'submit';

		// Equation input
		this.mathInputView = this._createMathInput();

		// Raw LaTeX input
		this.rawLatexInputView = this._createRawLatexInput();

		// Raw LaTeX label
		this.rawLatexLabel = new LabelView( locale );
		this.rawLatexLabel.text = t( 'LaTeX' );

		// Display button
		this.displayButtonView = this._createDisplayButton();

		// Cancel button
		this.cancelButtonView = this._createButton( t( 'Cancel' ), IconCancel, 'ck-button-cancel', 'cancel' );

		this.previewEnabled = previewEnabled;

		let children = [];
		if ( this.previewEnabled ) {
			// Preview label
			this.previewLabel = new LabelView( locale );
			this.previewLabel.text = t( 'Equation preview' );

			// Math element
			this.mathView = new MathView( engine, lazyLoad, locale, previewUid, previewClassName, katexRenderOptions );
			this.mathView.bind( 'display' ).to( this.displayButtonView, 'isOn' );

			children = [
				this.mathInputView,
				this.rawLatexLabel,
				this.rawLatexInputView,
				this.displayButtonView,
				this.previewLabel,
				this.mathView
			];
		} else {
			children = [
				this.mathInputView,
				this.rawLatexLabel,
				this.rawLatexInputView,
				this.displayButtonView
			];
		}

		// Add UI elements to template
		this.setTemplate( {
			tag: 'form',
			attributes: {
				class: [
					'ck',
					'ck-math-form',
					...popupClassName
				],
				tabindex: '-1',
				spellcheck: 'false'
			},
			children: [
				{
					tag: 'div',
					attributes: {
						class: [ 'ck-math-scroll' ]
					},
					children: [
						{
							tag: 'div',
							attributes: {
								class: [ 'ck-math-view' ]
							},
							children
						}
					]
				},
				{
					tag: 'div',
					attributes: {
						class: [ 'ck-math-button-row' ]
					},
					children: [
						this.saveButtonView,
						this.cancelButtonView
					]
				}
			]
		} );
	}

	public override render(): void {
		super.render();

		// Prevent default form submit event & trigger custom 'submit'
		submitHandler( {
			view: this
		} );

		// Register form elements to focusable elements
		const childViews = [
			this.mathInputView,
			this.rawLatexInputView,
			this.displayButtonView,
			this.saveButtonView,
			this.cancelButtonView
		];

		childViews.forEach( v => {
			if ( v.element ) {
				this._focusables.add( v );
				this.focusTracker.add( v.element );
			}
		} );

		// Listen to keypresses inside form element
		if ( this.element ) {
			this.keystrokes.listenTo( this.element );
		}
	}

	public focus(): void {
		this._focusCycler.focusFirst();
	}

	public get equation(): string {
		return this.mathInputView.value ?? '';
	}

	public set equation( equation: string ) {
		this.mathInputView.value = equation;
		this.rawLatexInputView.value = equation;
		if ( this.previewEnabled && this.mathView ) {
			this.mathView.value = equation;
		}
	}

	public focusTracker: FocusTracker = new FocusTracker();
	public keystrokes: KeystrokeHandler = new KeystrokeHandler();
	private _focusables = new ViewCollection<FocusableView>();
	private _focusCycler: FocusCycler = new FocusCycler( {
		focusables: this._focusables,
		focusTracker: this.focusTracker,
		keystrokeHandler: this.keystrokes,
		actions: {
			focusPrevious: 'shift + tab',
			focusNext: 'tab'
		}
	} );

	/**
	 * Creates the MathLive visual equation editor.
	 *
	 * Handles bidirectional synchronization with the raw LaTeX input and preview.
	 */
	private _createMathInput() {
		const mathInput = new MathLiveInputView( this.locale );

		const onInput = () => {
			const rawValue = mathInput.value ?? '';
			let equationInput = rawValue.trim();

			// If input has delimiters
			if ( hasDelimiters( equationInput ) ) {
				// Get equation without delimiters
				const params = extractDelimiters( equationInput );

				// Remove delimiters from input field
				mathInput.value = params.equation;

				equationInput = params.equation;

				// update display button and preview
				this.displayButtonView.isOn = params.display;
			}

			// Sync to raw LaTeX input
			this.rawLatexInputView.value = equationInput;

			if ( this.previewEnabled && this.mathView ) {
				// Update preview view
				this.mathView.value = equationInput;
			}

			this.saveButtonView.isEnabled = !!equationInput;
		};

		mathInput.on( 'change:value', onInput );

		return mathInput;
	}

	/**
	 * Creates the raw LaTeX code textarea editor.
	 *
	 * Provides direct LaTeX editing and synchronizes changes with the MathLive visual editor.
	 */
	private _createRawLatexInput() {
		const t = this.locale.t;
		const rawLatexInput = new RawLatexInputView( this.locale );
		rawLatexInput.label = t( 'LaTeX' );

		// Sync raw LaTeX changes to MathLive visual editor
		rawLatexInput.on( 'change:value', () => {
			const rawValue = rawLatexInput.value ?? '';
			const equationInput = rawValue.trim();

			// Update MathLive field
			if ( this.mathInputView.value !== equationInput ) {
				this.mathInputView.value = equationInput;
			}

			// Update preview if enabled
			if ( this.previewEnabled && this.mathView ) {
				this.mathView.value = equationInput;
			}

			this.saveButtonView.isEnabled = !!equationInput;
		} );

		return rawLatexInput;
	}

	private _createButton(
		label: string,
		icon: string,
		className: string,
		eventName: string | null
	) {
		const button = new ButtonView( this.locale );

		button.set( {
			label,
			icon,
			tooltip: true
		} );

		button.extendTemplate( {
			attributes: {
				class: className
			}
		} );

		if ( eventName ) {
			button.delegate( 'execute' ).to( this, eventName );
		}

		return button;
	}

	private _createDisplayButton() {
		const t = this.locale.t;

		const switchButton = new SwitchButtonView( this.locale );

		switchButton.set( {
			label: t( 'Display mode' ),
			withText: true
		} );

		switchButton.extendTemplate( {
			attributes: {
				class: 'ck-button-display-toggle'
			}
		} );

		switchButton.on( 'execute', () => {
			// Toggle state
			switchButton.isOn = !switchButton.isOn;

			if ( this.previewEnabled && this.mathView ) {
				// Update preview view
				this.mathView.display = switchButton.isOn;
			}
		} );

		return switchButton;
	}
}
