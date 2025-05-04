import type { Footnotes } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ Footnotes.pluginName ]: Footnotes;
	}
}
