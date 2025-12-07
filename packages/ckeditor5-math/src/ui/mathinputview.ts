import { View, type Locale } from 'ckeditor5';

interface MathFieldElement extends HTMLElement {
    value: string;
    readOnly: boolean;
    mathVirtualKeyboardPolicy: string;
    inlineShortcuts?: Record<string, string>;
    setValue(value: string, options?: { silenceNotifications?: boolean }): void;
}

/**
 * Combined math input with MathLive visual editor and raw LaTeX textarea.
 */
export default class MathInputView extends View {
    public declare value: string | null;
    public declare isReadOnly: boolean;

    public mathfield: MathFieldElement | null = null;
    private _textarea: HTMLTextAreaElement | null = null;

    constructor(locale: Locale) {
        super(locale);
        const t = locale.t;

        this.set('value', null);
        this.set('isReadOnly', false);

        this.setTemplate({
            tag: 'div',
            attributes: {
                class: ['ck', 'ck-math-input']
            },
            children: [
                // MathLive container
                {
                    tag: 'div',
                    attributes: { class: ['ck-mathlive-container'] }
                },
                // LaTeX label (outside wrapper)
                {
                    tag: 'label',
                    attributes: { class: ['ck-latex-label'] },
                    children: [t('LaTeX')]
                },
                // Raw LaTeX wrapper (just textarea now)
                {
                    tag: 'div',
                    attributes: { class: ['ck-latex-wrapper'] },
                    children: [
                        {
                            tag: 'textarea',
                            attributes: {
                                class: ['ck', 'ck-textarea', 'ck-latex-textarea'],
                                autocapitalize: 'off',
                                autocomplete: 'off',
                                autocorrect: 'off',
                                spellcheck: 'false'
                            }
                        }
                    ]
                }
            ]
        });
    }

    public override render(): void {
        super.render();

        this._textarea = this.element!.querySelector('.ck-latex-textarea') as HTMLTextAreaElement;
        this._textarea.value = this.value ?? '';
        this._textarea.readOnly = this.isReadOnly;

        this._loadMathLive();

        // Textarea -> observable (and sync to mathfield)
        this._textarea.addEventListener('input', () => {
            const val = this._textarea!.value;
            if (this.mathfield) {
                this.mathfield.setValue(val, { silenceNotifications: true });
            }
            this.value = val.length ? val : null;
        });

        // Observable -> textarea and mathfield
        this.on('change:value', (_evt, _name, newValue) => {
            const val = newValue ?? '';
            if (this._textarea && this._textarea.value !== val) {
                this._textarea.value = val;
            }
            if (this.mathfield && this.mathfield.value !== val) {
                this.mathfield.setValue(val, { silenceNotifications: true });
            }
        });

        this.on('change:isReadOnly', (_evt, _name, newValue) => {
            if (this._textarea) this._textarea.readOnly = newValue;
            if (this.mathfield) this.mathfield.readOnly = newValue;
        });
    }

    private async _loadMathLive(): Promise<void> {
        try {
            await import('mathlive');
            await customElements.whenDefined('math-field');

            // Disable MathLive sounds
            const MathfieldClass = customElements.get('math-field') as any;
            if (MathfieldClass) {
                MathfieldClass.soundsDirectory = null;
                MathfieldClass.plonkSound = null;
            }

            if (!this.element) return;
            this._createMathField();
        } catch (error) {
            console.error('MathLive load failed:', error);
            const container = this.element?.querySelector('.ck-mathlive-container');
            if (container) {
                container.textContent = 'Math editor unavailable';
            }
        }
    }

    private _createMathField(): void {
        const container = this.element?.querySelector('.ck-mathlive-container');
        if (!container) return;

        const mathfield = document.createElement('math-field') as MathFieldElement;
        mathfield.mathVirtualKeyboardPolicy = 'manual';

        // Add common shortcuts
        mathfield.addEventListener('mount', () => {
            mathfield.inlineShortcuts = {
                ...mathfield.inlineShortcuts,
                dx: 'dx',
                dy: 'dy',
                dt: 'dt'
            };
        }, { once: true });

        // Set initial value (may have been set before MathLive loaded)
        try {
            mathfield.value = this.value ?? '';
        } catch { /* MathLive may not be ready */ }
        mathfield.readOnly = this.isReadOnly;

        if (this._textarea && this.value) {
            this._textarea.value = this.value;
        }

        // MathLive -> textarea and observable
        mathfield.addEventListener('input', () => {
            try {
                const val = mathfield.value;
                if (this._textarea) this._textarea.value = val;
                this.value = val.length ? val : null;
            } catch { /* MathLive may not be ready */ }
        });

        // Observable -> MathLive
        this.on('change:value', (_evt, _name, newValue) => {
            try {
                const val = newValue ?? '';
                if (mathfield.value !== val) {
                    mathfield.setValue(val, { silenceNotifications: true });
                }
            } catch { /* MathLive may not be ready */ }
        });

        container.appendChild(mathfield);
        this.mathfield = mathfield;
    }

    public focus(): void {
        this.mathfield?.focus();
    }

    public hideKeyboard(): void {
        if (this.mathfield) {
            try {
                this.mathfield.blur();
                (this.mathfield as any).executeCommand?.('hideVirtualKeyboard');
            } catch { /* MathLive may already be disposed */ }
        }
    }

    public override destroy(): void {
        if (this.mathfield) {
            try {
                this.mathfield.blur();
                this.mathfield.remove();
            } catch { /* MathLive cleanup error */ }
            this.mathfield = null;
        }
        this._textarea = null;
        super.destroy();
    }
}
