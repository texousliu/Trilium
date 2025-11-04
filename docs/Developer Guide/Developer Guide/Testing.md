# Testing
## Unit testing and integration testing

Using `vitest`, there are some unit and integration tests done for both the client and the server.

These tests can be found by looking for the corresponding `.spec.ts` in the same directory as the source file.

<table><tbody><tr><td><p>To run the server-side tests:</p><pre><code class="language-text-x-trilium-auto">npm run server:test</code></pre><p>To view the code coverage for the server:</p><pre><code class="language-text-x-trilium-auto">npm run server:coverage</code></pre><p>Afterwards, a friendly HTML report can be found in <code>/coverage/index.html</code>.</p></td><td><p>To run the client-side tests:</p><pre><code class="language-text-x-trilium-auto">npm run client:test</code></pre><p>To view the code coverage for the client:</p><pre><code class="language-text-x-trilium-auto">npm run client:coverage</code></pre><p>Afterwards, a friendly HTML report can be found in <code>/src/public/app/coverage/index.html</code>.</p></td></tr></tbody></table>

To run both client and server-side tests:

```
npm run test
```

Note that some integration tests rely on an in-memory database in order to function. 

### REST API testing for the server

API tests are handled via `vitest` and `supertest` to initialize the Express server and run assertions without having to make actual requests to the server.

An important aspect is that we have access to the Express `app` which allows for interesting assertions such as checking the state of the server, registering debug middleware and so on.

One example is `src/share/routes.spec.ts`, or for the ETAPI in `apps/server/spec/etapi`.

These integration tests are run alongside unit tests.

## End-to-end testing

See <a class="reference-link" href="Testing/End-to-end%20tests.md">e2e tests</a>.