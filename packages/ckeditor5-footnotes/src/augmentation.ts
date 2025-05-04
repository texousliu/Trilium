import type { Footnotes } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ Footnotes.pluginName ]: Footnotes;
	}
}
