/**
 * @module "Backend Script API"
 *
 * The backend script API is accessible to code notes with the "JS (backend)" language.
 *
 * All the variables listed are globally accessible to the script.
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
