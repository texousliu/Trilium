import type { KeyboardMarker } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ KeyboardMarker.pluginName ]: KeyboardMarker;
	}
}
