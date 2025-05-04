import type { Admonition } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ Admonition.pluginName ]: Admonition;
	}
}
