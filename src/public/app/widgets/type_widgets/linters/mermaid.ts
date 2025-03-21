import mermaid from "mermaid";

interface MermaidParseError extends Error {
    hash: {
        text: string;
        token: string;
        line: number;
        loc: {
            first_line: number;
            first_column: number;
            last_line: number;
            last_column: number;
        };
        expected: string[]
    }
}

export default function registerErrorReporter() {
    CodeMirror.registerHelper("lint", null, (async (text, options) => {
        if (!text.trim()) {
            return [];
        }

        try {
            await mermaid.parse(text);
        } catch (e: unknown) {
            console.warn("Got validation error", JSON.stringify(e));

            const mermaidError = (e as MermaidParseError);
            const loc = mermaidError.hash.loc;
            return [
                {
                    message: mermaidError.message,
                    severity: "error",
                    from: CodeMirror.Pos(loc.first_line - 1, loc.first_column - 1),
                    to: CodeMirror.Pos(loc.last_line - 1, loc.last_column - 1)
                }
            ];
        }

        return [];
    }));
}
