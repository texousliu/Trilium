/**
 * The backend script API is accessible to code notes with the "JS (backend)" language.
 *
 * All the variables listed are globally accessible to the script.
 *
 * @module Backend Script API
 */

/**
 * This file creates the entrypoint for TypeDoc that simulates the context from within a
 * script note on the server side.
 *
 * Make sure to keep in line with backend's `script_context.ts`.
 */

import BNote from "../becca/entities/bnote.js";
import type { Api } from "./backend_script_api.js";
import BackendScriptApi from "./backend_script_api.js";

export type { Api };

const fakeNote = new BNote();

/**
 * The `code` api global variable allows access to the backend script API, which is documented in {@link Api}.
 */
export const api: Api = new BackendScriptApi(fakeNote, {});
