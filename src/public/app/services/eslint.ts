export async function lint(code: string) {

    const Linter = (await import("eslint-linter-browserify")).Linter;

    return new Linter().verify(code, {

    });

}
