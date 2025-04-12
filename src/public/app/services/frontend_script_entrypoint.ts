/**
 * The front script API is accessible to code notes with the "JS (frontend)" language.
 *
 * All the variables listed are globally accessible to the script.
 *
 * @module Frontend Script API
 */

/**
 * This file creates the entrypoint for TypeDoc that simulates the context from within a
 * script note.
 *
 * Make sure to keep in line with frontend's `script_context.ts`.
 */

import FrontendScriptApi, { type Api } from "./frontend_script_api.js";
export type { Api } from "./frontend_script_api.js";

//@ts-expect-error
export const api: Api = new FrontendScriptApi();
