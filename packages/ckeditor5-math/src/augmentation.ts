import type { Math } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ Math.pluginName ]: Math;
	}
}
