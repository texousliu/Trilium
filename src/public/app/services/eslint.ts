export async function lint(code: string) {

    const Linter = (await import("eslint-linter-browserify")).Linter;
    const js = (await import("@eslint/js"));
    const globals = (await import("globals"));

    return new Linter().verify(code, [
        js.configs.recommended,
        {
            languageOptions: {
                parserOptions: {
                    ecmaVersion: 2024
                },
                globals: {
                    ...globals.browser,
                    api: "readonly"
                }
            },
            rules: { }
        }
    ]);

}
