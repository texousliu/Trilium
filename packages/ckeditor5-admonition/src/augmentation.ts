import type { Admonition } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ Admonition.pluginName ]: Admonition;
	}
}
