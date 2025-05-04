import type { Mermaid } from './index.js';

declare module 'ckeditor5' {
	interface PluginsMap {
		[ Mermaid.pluginName ]: Mermaid;
	}
}
