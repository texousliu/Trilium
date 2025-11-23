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
	public mathLiveInputView: MathLiveInputView;
	public rawLatexInputView: RawLatexInputView;
	public rawLatexLabel: LabelView;
	public displayButtonView: SwitchButtonView;
	public cancelButtonView: ButtonView;
	public previewEnabled: boolean;
	public previewLabel?: LabelView;
	public mathView?: MathView;
	public override locale: Locale = new Locale();

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

		// MathLive visual equation editor
		this.mathLiveInputView = this._createMathLiveInput();

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
				this.mathLiveInputView,
				this.rawLatexLabel,
				this.rawLatexInputView,
				this.displayButtonView,
				this.previewLabel,
				this.mathView
			];
		} else {
			children = [
				this.mathLiveInputView,
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
			this.mathLiveInputView,
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

		this._initResizeSync();
	}

	public override destroy(): void {
		super.destroy();
		this._resizeObserver?.disconnect();
		document.removeEventListener( 'mouseup', this._onMouseUp );
	}

	public focus(): void {
		this._focusCycler.focusFirst();
	}

	public get equation(): string {
		return this.mathLiveInputView.value ?? '';
	}

	public set equation( equation: string ) {
		const normalizedEquation = equation.trim();
		this.mathLiveInputView.value = normalizedEquation.length ? normalizedEquation : null;
		this.rawLatexInputView.value = normalizedEquation;
		if ( this.previewEnabled && this.mathView ) {
			this.mathView.value = normalizedEquation;
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

	private _resizeObserver: ResizeObserver | null = null;
	private _activeResizeTarget: HTMLElement | null = null;

	private _onMouseUp = () => {
		this._activeResizeTarget = null;
		// Re-observe everything to ensure state is reset
		if ( this.mathLiveInputView.element ) this._resizeObserver?.observe( this.mathLiveInputView.element );
		if ( this.rawLatexInputView.element ) this._resizeObserver?.observe( this.rawLatexInputView.element );
	};

	private _onMouseDown( target: HTMLElement ) {
		this._activeResizeTarget = target;

		// Stop observing the OTHER element to prevent loops and errors while resizing
		if ( target === this.mathLiveInputView.element ) {
			if ( this.rawLatexInputView.element ) {
				this._resizeObserver?.unobserve( this.rawLatexInputView.element );
			}
		} else if ( target === this.rawLatexInputView.element ) {
			if ( this.mathLiveInputView.element ) {
				this._resizeObserver?.unobserve( this.mathLiveInputView.element );
			}
		}
	}

	private _initResizeSync() {
		this.listenTo( this.mathLiveInputView, 'mousedown', () => {
			if ( this.mathLiveInputView.element ) {
				this._onMouseDown( this.mathLiveInputView.element );
			}
		} );

		this.listenTo( this.rawLatexInputView, 'mousedown', () => {
			if ( this.rawLatexInputView.element ) {
				this._onMouseDown( this.rawLatexInputView.element );
			}
		} );

		document.addEventListener( 'mouseup', this._onMouseUp );

		// Synchronize width between MathLive and Raw LaTeX inputs
		this._resizeObserver = new ResizeObserver( entries => {
			if ( !this._activeResizeTarget ) {
				return;
			}

			for ( const entry of entries ) {
				if ( entry.target === this._activeResizeTarget ) {
					// Use style.width directly to avoid box-sizing issues causing infinite growth
					const width = ( entry.target as HTMLElement ).style.width;

					if ( !width ) continue;

					const other = entry.target === this.mathLiveInputView.element
						? this.rawLatexInputView.element
						: this.mathLiveInputView.element;

					if ( other && other.style.width !== width ) {
						window.requestAnimationFrame( () => {
							other.style.width = width;
						} );
					}
				}
			}
		} );

		if ( this.mathLiveInputView.element ) {
			this._resizeObserver.observe( this.mathLiveInputView.element );
		}
		if ( this.rawLatexInputView.element ) {
			this._resizeObserver.observe( this.rawLatexInputView.element );
		}
	}

	/**
	 * Creates the MathLive visual equation editor.
	 *
	 * Handles bidirectional synchronization with the raw LaTeX textarea and preview.
	 */
	private _createMathLiveInput() {
		const mathLiveInput = new MathLiveInputView( this.locale );

		const onInput = () => {
			let equationInput = ( mathLiveInput.value ?? '' ).trim();

			// If input has delimiters, strip them and update the display mode.
			if ( hasDelimiters( equationInput ) ) {
				const params = extractDelimiters( equationInput );
				equationInput = params.equation;
				this.displayButtonView.isOn = params.display;
			}

			const normalizedEquation = equationInput.length ? equationInput : null;

			// Update self if needed.
			if ( mathLiveInput.value !== normalizedEquation ) {
				mathLiveInput.value = normalizedEquation;
			}

			// Sync to raw LaTeX textarea if its value is different.
			if ( this.rawLatexInputView.value !== equationInput ) {
				this.rawLatexInputView.value = equationInput;
			}

			// Update preview if enabled and its value is different.
			if ( this.previewEnabled && this.mathView && this.mathView.value !== equationInput ) {
				this.mathView.value = equationInput;
			}
		};

		mathLiveInput.on( 'change:value', onInput );

		return mathLiveInput;
	}

	/**
	 * Creates the raw LaTeX textarea editor.
	 *
	 * Provides direct LaTeX code editing and synchronizes changes with the MathLive visual editor.
	 */
	private _createRawLatexInput() {
		const t = this.locale.t;
		const rawLatexInput = new RawLatexInputView( this.locale );
		rawLatexInput.label = t( 'LaTeX' );

		// Sync raw LaTeX textarea changes to MathLive visual editor
		rawLatexInput.on( 'change:value', () => {
			const rawValue = rawLatexInput.value ?? '';
			const equationInput = rawValue.trim();

			// Update MathLive visual editor
			const normalizedEquation = equationInput.length ? equationInput : null;
			if ( this.mathLiveInputView.value !== normalizedEquation ) {
				this.mathLiveInputView.value = normalizedEquation;
			}

			// Update preview
			if ( this.previewEnabled && this.mathView ) {
				this.mathView.value = equationInput;
			}
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
