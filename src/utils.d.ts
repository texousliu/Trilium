import { type Editor } from 'ckeditor5/src/core.js';
import { Element, Text, TextProxy, ViewElement } from 'ckeditor5/src/engine.js';
/**
 * Returns an array of all descendant elements of
 * the root for which the provided predicate returns true.
 */
export declare const modelQueryElementsAll: (editor: Editor, rootElement: Element, predicate?: (item: Element) => boolean) => Array<Element>;
/**
 * Returns an array of all descendant text nodes and text proxies of
 * the root for which the provided predicate returns true.
 */
export declare const modelQueryTextAll: (editor: Editor, rootElement: Element, predicate?: (item: Text | TextProxy) => boolean) => Array<Text | TextProxy>;
/**
 * Returns the first descendant element of the root for which the provided
 * predicate returns true, or null if no such element is found.
 */
export declare const modelQueryElement: (editor: Editor, rootElement: Element, predicate?: (item: Element) => boolean) => Element | null;
/**
 * Returns the first descendant text node or text proxy of the root for which the provided
 * predicate returns true, or null if no such element is found.
 */
export declare const modelQueryText: (editor: Editor, rootElement: Element, predicate?: (item: Text | TextProxy) => boolean) => Text | TextProxy | null;
/**
 * Returns the first descendant element of the root for which the provided
 * predicate returns true, or null if no such element is found.
 */
export declare const viewQueryElement: (editor: Editor, rootElement: ViewElement, predicate?: (item: ViewElement) => boolean) => ViewElement | null;
