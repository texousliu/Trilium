# Project Structure
As the application grew in complexity, we decided to switch to a monorepo based on `pnpm`. Our initial monorepo implementation used NX, but we've switched to pure `pnpm` workspaces and our own build scripts.

## Project structure

The mono-repo is mainly structured in:

*   `apps`, representing runnable entry-points such as the `desktop`, the `server` but also additional tooling.
    *   `client`, representing the front-end that is used both by the server and the desktop application.
    *   `server`, representing the Node.js / server version of the application.
    *   `desktop`, representing the Electron-based desktop application.
*   `packages`, containing dependencies used by one or more `apps`.
    *   `commons`, containing shared code for all the apps.

## Working with the project

For example to run the server instance:

```
pnpm server:start
```

## Important tasks

Each application has a number of tasks. Here's a non-exhaustive list of the tasks that are useful during development.

To run any of the tasks, use `pnpm project:task`:

*   `client`:
    *   The client is not meant to be run by itself, despite being described as an app. See the documentation on the server instead.
*   `server`:
    *   To run the server in development mode, run `server:start`. The dev port is `8080`.
    *   To run the server in production mode (with its own copy of the assets), run `server:start-prod`.
    *   To build for Docker, see <a class="reference-link" href="Building/Docker.md">Docker</a>.
*   `desktop`:
    *   To run the desktop in development mode with watch, run `desktop:start`.
    *   To run the desktop in production mode, run `desktop:start-prod`.

## Building packages

Generally, the building process of a project generates a `dist` folder containing everything needed for production.

## Managing dependencies across the mono-repo

We are using [pnpm workspaces](https://pnpm.io/workspaces) to manage the project structure. The workspace configuration is in `pnpm-workspace.yaml` at project level but it generally should not be modified.