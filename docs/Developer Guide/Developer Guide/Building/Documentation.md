# Documentation
## Editing the documentation

To edit the documentation run `pnpm edit-docs:edit-docs`. This will spin up a custom Trilium desktop instance which automatically imports the documentation into memory. Any changes will update in the background the files which can then be committed.

## Automation

The documentation is built via `apps/build-docs`:

1.  The output directory is cleared.
2.  The User Guide and the Developer Guide are built.
    1.  The documentation from the repo is archived and imported into an in-memory instance.
    2.  The documentation is exported using the shared theme.
3.  The API docs (internal and ETAPI) are statically rendered via Redocly.
4.  The script API is generated via `typedoc`

The `deploy-docs` workflow triggers the documentation build and uploads it to CloudFlare Pages.

## Building locally

In the Git root:

*   Run `pnpm docs:build`. The built documentation will be available in `site` at Git root.
*   To also run a webserver to test it, run `pnpm docs:preview` (this will not build the documentation) and navigate to `localhost:9000`.