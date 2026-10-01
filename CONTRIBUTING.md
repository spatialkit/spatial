# Contributing to Spatial

Thanks for your interest in contributing. This guide covers how to set up the project, the conventions the code follows, and how changes get released.

By participating, you agree to follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug**: open an issue using the bug report template. Include a minimal reproduction.
- **Suggest a feature**: open an issue using the feature request template before writing code, so the design can be discussed first.
- **Improve the docs**: fixes to READMEs and examples are always welcome.
- **Pick an issue**: issues labeled [`good first issue`](https://github.com/spatialkit/spatial/labels/good%20first%20issue) or [`help wanted`](https://github.com/spatialkit/spatial/labels/help%20wanted) are a good place to start. Comment on the issue before starting, so work isn't duplicated.

Security issues must not be reported in public issues. See [SECURITY.md](./SECURITY.md).

## Development setup

**Prerequisites:** Node.js 22 (see [`.nvmrc`](./.nvmrc)) and pnpm 10.

```bash
git clone https://github.com/<your-username>/spatial.git
cd spatial
pnpm install
pnpm test
```

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests once (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Build the publishable packages (ESM + CJS + types) |
| `pnpm dev` | Start the vanilla JS example (Vite) |
| `pnpm dev:react` | Start the React example (Vite) |

## Repository layout

```
packages/
  core/             @spatialkit/core   — scene engine, viewport, selection, events, picking
  svg/              @spatialkit/svg    — SVG renderer + DOM event handlers
  adapters/
    react/          @spatialkit/react  — React adapter (hooks + SpatialCanvas)
  examples/
    js-vanilla/     vanilla JS example (not published)
    react/          React example (not published)
```

Each package README documents its public API.

## Code conventions

- **No production dependencies** in `@spatialkit/core`, `@spatialkit/svg` or `@spatialkit/react`. Peer dependencies on other `@spatialkit/*` packages and on React are the only exceptions.
- **`@spatialkit/core` stays framework-agnostic**: no DOM, no browser APIs.
- **TypeScript strict**: no `any`, no unused variables (prefix intentionally unused arguments with `_`).
- **Branded ids**: use `EntityId` and `LayerId`, never plain `string`.
- **Immutable selection**: never mutate the `Set` returned by `applySelection`.
- **Factory functions over classes** (`createCore`, `createEmptyScene`).
- **Comments** only when the *why* is not obvious from the code.
- **Formatting**: Prettier (single quotes, semicolons, 100-character lines). Run `npx prettier --write <files>` on what you changed.

## Tests

- Tests live in `src/__tests__/*.test.ts(x)` inside each package.
- `core` tests run in Node; `svg` and `react` tests run in jsdom.
- jsdom returns a zero rect from `getBoundingClientRect` and does not implement `setPointerCapture` or `ResizeObserver`. Mock them in tests that depend on them.
- New features and bug fixes need tests. A bug fix should include a test that fails without the fix.

## Pull requests

1. Fork the repository and create a branch from `main` (for example `fix/pinch-zoom-origin` or `feat/rubber-band-selection`).
2. Make the change, with tests and docs.
3. Add a changeset if the change affects a published package (see below).
4. Make sure everything passes locally:

   ```bash
   pnpm typecheck && pnpm test && pnpm lint && pnpm build
   ```

5. Open the pull request against `main` and fill in the template. Keep it focused on one change.

CI runs the same checks on every pull request. A maintainer will review it; please be patient and responsive to feedback.

## Changesets and releases

Versioning and changelogs are managed with [Changesets](https://github.com/changesets/changesets). If your change affects a published package, run:

```bash
pnpm changeset
```

Pick the affected packages and the bump type, and write a short summary for the changelog. Commit the generated file in `.changeset/` with your pull request.

While the packages are on `0.x`:

- `patch`: bug fixes and internal changes
- `minor`: new features **and** breaking changes

Changes to docs, tests, examples or tooling don't need a changeset.

After merge, a bot opens a "version packages" pull request. When a maintainer merges it, the packages are published to npm automatically.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
