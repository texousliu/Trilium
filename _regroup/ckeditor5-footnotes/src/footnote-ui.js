import { Plugin } from 'ckeditor5/src/core.js';
import { addListToDropdown, createDropdown, SplitButtonView, ViewModel } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';
import { ATTRIBUTES, COMMANDS, ELEMENTS, TOOLBAR_COMPONENT_NAME } from './constants.js';
import insertFootnoteIcon from '../theme/icons/insert-footnote.svg';
import { modelQueryElement, modelQueryElementsAll } from './utils.js';
export default class FootnoteUI extends Plugin {
    init() {
        const editor = this.editor;
        const translate = editor.t;
        editor.ui.componentFactory.add(TOOLBAR_COMPONENT_NAME, locale => {
            const dropdownView = createDropdown(locale, SplitButtonView);
            const splitButtonView = dropdownView.buttonView;
            // Populate the list in the dropdown with items.
            // addListToDropdown( dropdownView, getDropdownItemsDefinitions( placeholderNames ) );
            const command = editor.commands.get(COMMANDS.insertFootnote);
            if (!command) {
                throw new Error('Command not found.');
            }
            splitButtonView.set({
                label: translate('Footnote'),
                icon: insertFootnoteIcon,
                tooltip: true,
                isToggleable: true
            });
            splitButtonView.bind('isOn').to(command, 'value', value => !!value);
            splitButtonView.on('execute', () => {
                editor.execute(COMMANDS.insertFootnote, {
                    footnoteIndex: 0
                });
                editor.editing.view.focus();
            });
            dropdownView.class = 'ck-code-block-dropdown';
            dropdownView.bind('isEnabled').to(command);
            dropdownView.on('change:isOpen', (evt, propertyName, newValue) => {
                var _a, _b, _c;
                (_a = dropdownView === null || dropdownView === void 0 ? void 0 : dropdownView.listView) === null || _a === void 0 ? void 0 : _a.items.clear();
                if (newValue) {
                    addListToDropdown(dropdownView, this.getDropdownItemsDefinitions());
                }
                else {
                    (_b = dropdownView === null || dropdownView === void 0 ? void 0 : dropdownView.listView) === null || _b === void 0 ? void 0 : _b.items.clear();
                    const listElement = (_c = dropdownView === null || dropdownView === void 0 ? void 0 : dropdownView.listView) === null || _c === void 0 ? void 0 : _c.element;
                    if (listElement && listElement.parentNode) {
                        listElement.parentNode.removeChild(listElement);
                    }
                }
            });
            // Execute the command when the dropdown item is clicked (executed).
            this.listenTo(dropdownView, 'execute', evt => {
                editor.execute(COMMANDS.insertFootnote, {
                    footnoteIndex: evt.source.commandParam
                });
                editor.editing.view.focus();
            });
            return dropdownView;
        });
    }
    getDropdownItemsDefinitions() {
        const itemDefinitions = new Collection();
        const defaultDef = {
            type: 'button',
            model: new ViewModel({
                commandParam: 0,
                label: 'New footnote',
                withText: true
            })
        };
        itemDefinitions.add(defaultDef);
        const rootElement = this.editor.model.document.getRoot();
        if (!rootElement) {
            throw new Error('Document has no root element.');
        }
        const footnoteSection = modelQueryElement(this.editor, rootElement, element => element.is('element', ELEMENTS.footnoteSection));
        if (footnoteSection) {
            const footnoteItems = modelQueryElementsAll(this.editor, rootElement, element => element.is('element', ELEMENTS.footnoteItem));
            footnoteItems.forEach(footnote => {
                const index = footnote.getAttribute(ATTRIBUTES.footnoteIndex);
                const definition = {
                    type: 'button',
                    model: new ViewModel({
                        commandParam: index,
                        label: `Insert footnote ${index}`,
                        withText: true
                    })
                };
                itemDefinitions.add(definition);
            });
        }
        return itemDefinitions;
    }
}
//# sourceMappingURL=footnote-ui.js.map