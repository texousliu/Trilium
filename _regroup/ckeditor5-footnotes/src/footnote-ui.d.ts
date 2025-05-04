import { Plugin } from 'ckeditor5/src/core.js';
import { type ListDropdownItemDefinition } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';
export default class FootnoteUI extends Plugin {
    init(): void;
    getDropdownItemsDefinitions(): Collection<ListDropdownItemDefinition>;
}
