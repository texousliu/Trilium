// TODO: deduplicate with /src/services/import/mime_type_definitions.ts

/**
 * A pseudo-MIME type which is used in the editor to automatically determine the language used in code blocks via heuristics.
 */
export const MIME_TYPE_AUTO = "text-x-trilium-auto";

export interface MimeTypeDefinition {
    default?: boolean;
    title: string;
    mime: string;
    /** The name of the language/mime type as defined by highlight.js (or one of the aliases), in order to be used for syntax highlighting such as inside code blocks. */
    highlightJs?: string;
    /** If specified, will load the corresponding highlight.js file from the `libraries/highlightjs/${id}.js` instead of `node_modules/@highlightjs/cdn-assets/languages/${id}.min.js`. */
    highlightJsSource?: "libraries";
    /** If specified, will load the corresponding highlight file from the given path instead of `node_modules`. */
    codeMirrorSource?: string;
}

/**
 * For highlight.js-supported languages, see https://github.com/highlightjs/highlight.js/blob/main/SUPPORTED_LANGUAGES.md.
 */

export const MIME_TYPES_DICT: readonly MimeTypeDefinition[] = Object.freeze([
    { title: "Plain text", mime: "text/plain", default: true },

    // Keep sorted alphabetically.
    { title: "APL", mime: "text/apl" },
    { title: "ASN.1", mime: "text/x-ttcn-asn" },
    { title: "ASP.NET", mime: "application/x-aspx" },
    { title: "Asterisk", mime: "text/x-asterisk" },
    { title: "Batch file (DOS)", mime: "application/x-bat", codeMirrorSource: "libraries/codemirror/batch.js" },
    { title: "Brainfuck", mime: "text/x-brainfuck" },
    { title: "C", mime: "text/x-csrc", default: true },
    { title: "C#", mime: "text/x-csharp", default: true },
    { title: "C++", mime: "text/x-c++src", default: true },
    { title: "Clojure", mime: "text/x-clojure" },
    { title: "ClojureScript", mime: "text/x-clojurescript" },
    { title: "Closure Stylesheets (GSS)", mime: "text/x-gss" },
    { title: "CMake", mime: "text/x-cmake" },
    { title: "Cobol", mime: "text/x-cobol" },
    { title: "CoffeeScript", mime: "text/coffeescript" },
    { title: "Common Lisp", mime: "text/x-common-lisp" },
    { title: "CQL", mime: "text/x-cassandra" },
    { title: "Crystal", mime: "text/x-crystal" },
    { title: "CSS", mime: "text/css", default: true },
    { title: "Cypher", mime: "application/x-cypher-query" },
    { title: "Cython", mime: "text/x-cython" },
    { title: "D", mime: "text/x-d" },
    { title: "Dart", mime: "application/dart" },
    { title: "diff", mime: "text/x-diff" },
    { title: "Django", mime: "text/x-django" },
    { title: "Dockerfile", mime: "text/x-dockerfile" },
    { title: "DTD", mime: "application/xml-dtd" },
    { title: "Dylan", mime: "text/x-dylan" },
    { title: "EBNF", mime: "text/x-ebnf" },
    { title: "ECL", mime: "text/x-ecl" },
    { title: "edn", mime: "application/edn" },
    { title: "Eiffel", mime: "text/x-eiffel" },
    { title: "Elm", mime: "text/x-elm" },
    { title: "Embedded Javascript", mime: "application/x-ejs" },
    { title: "Embedded Ruby", mime: "application/x-erb" },
    { title: "Erlang", mime: "text/x-erlang" },
    { title: "Esper", mime: "text/x-esper" },
    { title: "F#", mime: "text/x-fsharp" },
    { title: "Factor", mime: "text/x-factor" },
    { title: "FCL", mime: "text/x-fcl" },
    { title: "Forth", mime: "text/x-forth" },
    { title: "Fortran", mime: "text/x-fortran" },
    { title: "Gas", mime: "text/x-gas" },
    { title: "GDScript (Godot)", mime: "text/x-gdscript" },
    { title: "Gherkin", mime: "text/x-feature" },
    { title: "GitHub Flavored Markdown", mime: "text/x-gfm" },
    { title: "Go", mime: "text/x-go", default: true },
    { title: "Groovy", mime: "text/x-groovy", default: true },
    { title: "HAML", mime: "text/x-haml" },
    { title: "Haskell (Literate)", mime: "text/x-literate-haskell" },
    { title: "Haskell", mime: "text/x-haskell", default: true },
    { title: "Haxe", mime: "text/x-haxe" },
    { title: "HTML", mime: "text/html", default: true },
    { title: "HTTP", mime: "message/http", default: true },
    { title: "HXML", mime: "text/x-hxml" },
    { title: "IDL", mime: "text/x-idl" },
    { title: "Java Server Pages", mime: "application/x-jsp" },
    { title: "Java", mime: "text/x-java", default: true },
    { title: "Jinja2", mime: "text/jinja2" },
    { title: "JS backend", mime: "application/javascript;env=backend", default: true },
    { title: "JS frontend", mime: "application/javascript;env=frontend", default: true },
    { title: "JSON-LD", mime: "application/ld+json"},
    { title: "JSON", mime: "application/json" },
    { title: "JSX", mime: "text/jsx" },
    { title: "Julia", mime: "text/x-julia" },
    { title: "Kotlin", mime: "text/x-kotlin", default: true },
    { title: "LaTeX", mime: "text/x-latex" },
    { title: "LESS", mime: "text/x-less" },
    { title: "LiveScript", mime: "text/x-livescript" },
    { title: "Lua", mime: "text/x-lua" },
    { title: "MariaDB SQL", mime: "text/x-mariadb" },
    { title: "Markdown", mime: "text/x-markdown", default: true },
    { title: "Mathematica", mime: "text/x-mathematica" },
    { title: "mbox", mime: "application/mbox" },
    { title: "MIPS Assembler", mime: "text/x-asm-mips" },
    { title: "mIRC", mime: "text/mirc" },
    { title: "Modelica", mime: "text/x-modelica" },
    { title: "MS SQL", mime: "text/x-mssql" },
    { title: "mscgen", mime: "text/x-mscgen" },
    { title: "msgenny", mime: "text/x-msgenny" },
    { title: "MUMPS", mime: "text/x-mumps" },
    { title: "MySQL", mime: "text/x-mysql" },
    { title: "Nix", mime: "text/x-nix" },
    { title: "Nginx", mime: "text/x-nginx-conf" },
    { title: "NSIS", mime: "text/x-nsis" },
    { title: "NTriples", mime: "application/n-triples" },
    { title: "Objective-C", mime: "text/x-objectivec" },
    { title: "OCaml", mime: "text/x-ocaml" },
    { title: "Octave", mime: "text/x-octave" },
    { title: "Oz", mime: "text/x-oz" },
    { title: "Pascal", mime: "text/x-pascal" },
    { title: "PEG.js", mime: "null" },
    { title: "Perl", mime: "text/x-perl", default: true },
    { title: "PGP", mime: "application/pgp" },
    { title: "PHP", mime: "text/x-php", default: true },
    { title: "Pig", mime: "text/x-pig" },
    { title: "PLSQL", mime: "text/x-plsql" },
    { title: "PostgreSQL", mime: "text/x-pgsql" },
    { title: "PowerShell", mime: "application/x-powershell" },
    { title: "Properties files", mime: "text/x-properties" },
    { title: "ProtoBuf", mime: "text/x-protobuf" },
    { title: "Pug", mime: "text/x-pug" },
    { title: "Puppet", mime: "text/x-puppet" },
    { title: "Python", mime: "text/x-python", default: true },
    { title: "Q", mime: "text/x-q" },
    { title: "R", mime: "text/x-rsrc" },
    { title: "reStructuredText", mime: "text/x-rst" },
    { title: "RPM Changes", mime: "text/x-rpm-changes" },
    { title: "RPM Spec", mime: "text/x-rpm-spec" },
    { title: "Ruby", mime: "text/x-ruby", default: true },
    { title: "Rust", mime: "text/x-rustsrc" },
    { title: "SAS", mime: "text/x-sas" },
    { title: "Sass", mime: "text/x-sass" },
    { title: "Scala", mime: "text/x-scala" },
    { title: "Scheme", mime: "text/x-scheme" },
    { title: "SCSS", mime: "text/x-scss" },
    { title: "Shell (bash)", mime: "text/x-sh", default: true },
    { title: "Sieve", mime: "application/sieve" },
    { title: "Slim", mime: "text/x-slim" },
    { title: "Smalltalk", mime: "text/x-stsrc" },
    { title: "Smarty", mime: "text/x-smarty" },
    { title: "SML", mime: "text/x-sml" },
    { title: "Solr", mime: "text/x-solr" },
    { title: "Soy", mime: "text/x-soy" },
    { title: "SPARQL", mime: "application/sparql-query" },
    { title: "Spreadsheet", mime: "text/x-spreadsheet" },
    { title: "SQL", mime: "text/x-sql", default: true },
    { title: "SQLite (Trilium)", mime: "text/x-sqlite;schema=trilium", default: true },
    { title: "SQLite", mime: "text/x-sqlite" },
    { title: "Squirrel", mime: "text/x-squirrel" },
    { title: "sTeX", mime: "text/x-stex" },
    { title: "Stylus", mime: "text/x-styl" },
    { title: "Swift", mime: "text/x-swift", default: true },
    { title: "SystemVerilog", mime: "text/x-systemverilog" },
    { title: "Tcl", mime: "text/x-tcl" },
    { title: "Terraform (HCL)", mime: "text/x-hcl", codeMirrorSource: "libraries/codemirror/hcl.js" },
    { title: "Textile", mime: "text/x-textile" },
    { title: "TiddlyWiki ", mime: "text/x-tiddlywiki" },
    { title: "Tiki wiki", mime: "text/tiki" },
    { title: "TOML", mime: "text/x-toml" },
    { title: "Tornado", mime: "text/x-tornado" },
    { title: "troff", mime: "text/troff" },
    { title: "TTCN_CFG", mime: "text/x-ttcn-cfg" },
    { title: "TTCN", mime: "text/x-ttcn" },
    { title: "Turtle", mime: "text/turtle" },
    { title: "Twig", mime: "text/x-twig" },
    { title: "TypeScript-JSX", mime: "text/typescript-jsx" },
    { title: "TypeScript", mime: "application/typescript" },
    { title: "VB.NET", mime: "text/x-vb" },
    { title: "VBScript", mime: "text/vbscript" },
    { title: "Velocity", mime: "text/velocity" },
    { title: "Verilog", mime: "text/x-verilog" },
    { title: "VHDL", mime: "text/x-vhdl" },
    { title: "Vue.js Component", mime: "text/x-vue" },
    { title: "Web IDL", mime: "text/x-webidl" },
    { title: "XML", mime: "text/xml", default: true },
    { title: "XQuery", mime: "application/xquery" },
    { title: "xu", mime: "text/x-xu" },
    { title: "Yacas", mime: "text/x-yacas" },
    { title: "YAML", mime: "text/x-yaml", default: true },
    { title: "Z80", mime: "text/x-z80" }
]);

/**
 * Given a MIME type in the usual format (e.g. `text/csrc`), it returns a MIME type that can be passed down to the CKEditor
 * code plugin.
 *
 * @param mimeType The MIME type to normalize, in the usual format (e.g. `text/c-src`).
 * @returns the normalized MIME type (e.g. `text-c-src`).
 */
export function normalizeMimeTypeForCKEditor(mimeType: string) {
    return mimeType.toLowerCase().replace(/[\W_]+/g, "-");
}

let byHighlightJsNameMappings: Record<string, MimeTypeDefinition> | null = null;

/**
 * Given a Highlight.js language tag (e.g. `css`), it returns a corresponding {@link MimeTypeDefinition} if found.
 *
 * If there are multiple {@link MimeTypeDefinition}s for the language tag, then only the first one is retrieved. For example for `javascript`, the "JS frontend" mime type is returned.
 *
 * @param highlightJsName a language tag.
 * @returns the corresponding {@link MimeTypeDefinition} if found, or `undefined` otherwise.
 */
export function getMimeTypeFromHighlightJs(highlightJsName: string) {
    if (!byHighlightJsNameMappings) {
        byHighlightJsNameMappings = {};
        for (const mimeType of MIME_TYPES_DICT) {
            if (mimeType.highlightJs && !byHighlightJsNameMappings[mimeType.highlightJs]) {
                byHighlightJsNameMappings[mimeType.highlightJs] = mimeType;
            }
        }
    }

    return byHighlightJsNameMappings[highlightJsName];
}
